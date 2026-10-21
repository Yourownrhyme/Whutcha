import SwiftUI
import AVFoundation

class CardPlayerModel: ObservableObject {
    @Published var player: AVPlayer?
    @Published var isPlaying = false
    
    // 🔥 Добавляем ссылку на обсервер для правильной отписки
    private var loopObserver: Any?
    
    func setupAndPlay(videoHash: String, supabaseURL: String) {
        guard player == nil else { return } // Не создаем плеер дважды
        
        let fullURL = videoHash.contains("http") ? videoHash : "\(supabaseURL)/storage/v1/object/public/videos/\(videoHash)"
        guard let url = URL(string: fullURL) else { return }
        
        let newPlayer = AVPlayer(url: url)
        self.player = newPlayer
        newPlayer.play()
        self.isPlaying = true
        
        // Магия для авто-зацикливания (Looping) 15-секундного видео
        loopObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: newPlayer.currentItem,
            queue: .main) { [weak self] _ in
                self?.player?.seek(to: .zero)
                self?.player?.play()
                self?.isPlaying = true
        }
    }
    
    func togglePlay() {
        guard let player = player else { return }
        if isPlaying {
            player.pause()
        } else {
            player.play()
        }
        isPlaying.toggle()
    }
    
    func cleanup() {
        self.player?.pause()
        self.player = nil
        self.isPlaying = false
        
        // 🔥 Правильная отписка от уведомлений
        if let observer = loopObserver {
            NotificationCenter.default.removeObserver(observer)
            loopObserver = nil
        }
    }
}
