import Foundation
import Supabase
import SwiftUI

// Изолированный клиент
private let supabaseUrl = URL(string: "https://kjoffilncbybquvjytxx.supabase.co")!
private let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2ZmaWxuY2J5YnF1dmp5dHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzM1MjgsImV4cCI6MjA5Njk0OTUyOH0.C7VSZspoYz_Qqc_cZBUCxA1citn301hub1o8NFcUefU"
private let queueSupabase = SupabaseClient(supabaseURL: supabaseUrl, supabaseKey: supabaseKey)

// Приватная модель для обновления статусов
private struct QueueStatusUpdate: Encodable {
    let status: String
}

// 🔥 Модель для записи в таблицу банов
private struct BanRecord: Encodable {
    let streamer_id: String
    let device_id: String
}

@MainActor
class QueueViewModel: ObservableObject {
    @Published var donations: [Donation] = []
    
    // 🔥 ОДИН таймер на всё приложение
    @Published var currentTime: Date = Date()
    private var clockTimer: Timer?
    private var tickCount = 0

    func fetchQueue() {
        // Запускаем единые часы (тикают 1 раз в секунду для UI)
        // 🔥 ИСПРАВЛЕНИЕ: Используем [weak self] чтобы избежать Retain Cycle
        clockTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            DispatchQueue.main.async {
                self.currentTime = Date()
                self.tickCount += 1
                
                // Каждые 3 секунды тихо дергаем базу за новыми донатами
                if self.tickCount % 3 == 0 {
                    Task { await self.loadDonations() }
                }
            }
        }
        
        Task { await loadDonations() }
    }

    private func loadDonations() async {
        do {
            let data: [Donation] = try await queueSupabase.database
                .from("donations")
                .select()
                .eq("status", value: "pending")
                .order("amount", ascending: false)
                .order("created_at", ascending: true)
                .execute()
                .value
            
            DispatchQueue.main.async {
                self.donations = data
            }
        } catch {
            print("Fetch error: \(error)")
        }
    }

    func stopListening() {
        clockTimer?.invalidate()
        clockTimer = nil
    }
    
    func approveDonation(id: UUID) async {
        do {
            try await queueSupabase.database
                .from("donations")
                .update(QueueStatusUpdate(status: "approved"))
                .eq("id", value: id)
                .execute()
            await loadDonations()
        } catch {
            print("Approve error: \(error)")
        }
    }
    
    // 🔥 ФУНКЦИЯ ДЛЯ ВЫВОДА ВИДЕО НА OBS
    func playOnStream(id: UUID) async {
        do {
            try await queueSupabase.database
                .from("donations")
                .update(QueueStatusUpdate(status: "playing")) // Отправляем статус playing
                .eq("id", value: id)
                .execute()
            await loadDonations()
        } catch {
            print("Play on stream error: \(error)")
        }
    }
    
    func rejectDonation(id: UUID) async {
        do {
            try await queueSupabase.database
                .from("donations")
                .update(QueueStatusUpdate(status: "rejected"))
                .eq("id", value: id)
                .execute()
            await loadDonations()
        } catch {
            print("Reject error: \(error)")
        }
    }
    
    // 🔥 ФУНКЦИЯ БАНА
    func banUser(deviceId: String) async {
        guard let streamerId = UserDefaults.standard.string(forKey: "streamerID") else { return }
        
        do {
            let record = BanRecord(streamer_id: streamerId, device_id: deviceId)
            
            try await queueSupabase.database
                .from("banned_devices")
                .insert(record)
                .execute()
            
            print("🔨 Токсик забанен! Device ID: \(deviceId)")
            
            await loadDonations() // Перезагружаем очередь после бана
        } catch {
            print("Ban error: \(error)")
        }
    }
}
