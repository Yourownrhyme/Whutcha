import Foundation
import SwiftUI
import Supabase

// Строгие модели для замены AnyJSON
struct OverlaySettingsData: Decodable {
    let overlay_position: String?
    let overlay_scale: Double?
}

struct OverlaySettingsUpdate: Encodable {
    let overlay_position: String
    let overlay_scale: Double
}

@MainActor
class OverlayManager: ObservableObject {
    @Published var position: String = "bottom-right"
    @Published var scale: Double = 1.0
    @Published var isSaving = false
    
    // Загружаем текущие настройки
    func fetchSettings(streamerID: String) async {
        do {
            let data: OverlaySettingsData = try await AppConstants.client.database
                .from("profiles")
                .select("overlay_position, overlay_scale")
                .eq("id", value: streamerID)
                .single()
                .execute()
                .value
            
            if let pos = data.overlay_position {
                self.position = pos
            }
            if let scl = data.overlay_scale {
                self.scale = scl
            }
        } catch {
            print("❌ Ошибка загрузки настроек OBS: \(error.localizedDescription)")
        }
    }
    
    // Сохраняем новые настройки
    func saveSettings(streamerID: String) async {
        isSaving = true
        do {
            let updateData = OverlaySettingsUpdate(
                overlay_position: position,
                overlay_scale: scale
            )
            
            try await AppConstants.client.database
                .from("profiles")
                .update(updateData)
                .eq("id", value: streamerID)
                .execute()
            
            print("✅ Настройки OBS сохранены!")
        } catch {
            print("❌ Ошибка сохранения OBS: \(error.localizedDescription)")
        }
        isSaving = false
    }
}
