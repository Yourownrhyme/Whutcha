import SwiftUI
import AVFoundation

@main
struct WhutchaApp: App {
    
    // Инициализируем аудио-сессию при старте приложения
    init() {
        do {
            // Разрешаем плееру играть звук даже если на iPhone включен беззвучный режим
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("❌ Ошибка настройки AVAudioSession: \(error)")
        }
    }
    
    var body: some Scene {
        WindowGroup {
            SplashView()
        }
    }
}
