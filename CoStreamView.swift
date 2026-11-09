import SwiftUI
import LiveKit

struct CoStreamView: View {
    @StateObject private var liveManager = LiveManager()
    @Environment(\.dismiss) var dismiss
    
    let roomName: String
    let appBackground = Color(red: 0.04, green: 0.04, blue: 0.06)
    
    var body: some View {
        ZStack {
            appBackground.edgesIgnoringSafeArea(.all)
            
            if liveManager.isConnected {
                // 1. REMOTE VIDEO (Full Screen - Зритель)
                if let remoteTrack = liveManager.remoteVideoTrack {
                    SwiftUIVideoView(remoteTrack)
                        .edgesIgnoringSafeArea(.all)
                } else {
                    VStack(spacing: 20) {
                        ZStack {
                            Circle().fill(Color.cyan.opacity(0.1)).frame(width: 100, height: 100)
                            ProgressView().tint(.cyan).scaleEffect(1.5)
                        }
                        Text("Waiting for viewer to connect...")
                            .font(.system(size: 16, weight: .medium, design: .rounded))
                            .foregroundColor(.gray)
                    }
                }
                
                // 2. ИНТЕРФЕЙС ПОВЕРХ ВИДЕО
                VStack {
                    // Верхний бар (Live индикатор)
                    HStack {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(Color.red)
                                .frame(width: 8, height: 8)
                                .opacity(0.8)
                            Text("LIVE CO-STREAM")
                                .font(.system(size: 12, weight: .black, design: .monospaced))
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.black.opacity(0.6))
                        .clipShape(Capsule())
                        
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    
                    Spacer()
                    
                    // Нижний бар (Камера стримера + Кнопка сброса)
                    HStack(alignment: .bottom) {
                        // Канопка отключения
                        Button(action: {
                            Task {
                                await liveManager.disconnect()
                                dismiss()
                            }
                        }) {
                            Image(systemName: "phone.down.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.white)
                                .frame(width: 64, height: 64)
                                .background(LinearGradient(colors: [.red, Color(red: 0.7, green: 0, blue: 0)], startPoint: .top, endPoint: .bottom))
                                .clipShape(Circle())
                                .shadow(color: .red.opacity(0.4), radius: 10, y: 5)
                        }
                        .padding(.bottom, 20)
                        
                        Spacer()
                        
                        // Локальное видео (стример)
                        if let localTrack = liveManager.localVideoTrack {
                            SwiftUIVideoView(localTrack)
                                .frame(width: 110, height: 160)
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.2), lineWidth: 1))
                                .shadow(color: .black.opacity(0.5), radius: 15, y: 10)
                                .padding(.bottom, 20)
                        }
                    }
                    .padding(.horizontal, 20)
                }
                
            } else {
                // ЭКРАН ПОДКЛЮЧЕНИЯ
                VStack(spacing: 24) {
                    Text("W")
                        .font(.system(size: 60, weight: .heavy, design: .rounded))
                        .foregroundStyle(LinearGradient(colors: [Color(red: 0.6, green: 0.2, blue: 0.9), Color(red: 0.2, green: 0.8, blue: 0.9)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    
                    ProgressView().tint(.white)
                    
                    Text("Connecting to secure room...")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.gray)
                }
            }
        }
        .task {
            await fetchTokenAndConnect()
        }
        .onDisappear {
            Task {
                await liveManager.disconnect()
            }
        }
    }
    
    // Функция получения токена через Edge Function (осталась без изменений)
    private func fetchTokenAndConnect() async {
        guard let url = URL(string: "\(AppConstants.supabaseURL)/functions/v1/get-streamer-token") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(AppConstants.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        let body: [String: Any] = ["room_name": roomName]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, response) = try await URLSession.shared.data(for: request)
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let token = json["token"] as? String {
                    await liveManager.connectToLive(url: AppConstants.liveKitURL, token: token)
                }
            }
        } catch {
            print("❌ Network error: \(error.localizedDescription)")
        }
    }
}
