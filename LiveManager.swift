import Foundation
import LiveKit

@MainActor
class LiveManager: ObservableObject, RoomDelegate {
    @Published var isConnected = false
    @Published var localVideoTrack: VideoTrack?
    @Published var remoteVideoTrack: VideoTrack?
    
    private var room: Room
    
    init() {
        self.room = Room()
        self.room.add(delegate: self)
    }
    
    // Подключение к трансляции
    func connectToLive(url: String, token: String) async {
        do {
            try await room.connect(url, token)
            self.isConnected = true
            
            if let localParticipant = room.localParticipant {
                try await localParticipant.setCamera(enabled: true)
                try await localParticipant.setMicrophone(enabled: true)
                
                // Берем первый трек напрямую из массива (без .values)
                if let publication = localParticipant.videoTracks.first,
                   let track = publication.track as? VideoTrack {
                    self.localVideoTrack = track
                }
            }
        } catch {
            print("❌ Ошибка подключения к LiveKit: \(error.localizedDescription)")
        }
    }
    
    // Отключение от трансляции
    func disconnect() async {
        try? await room.disconnect()
        self.isConnected = false
        self.localVideoTrack = nil
        self.remoteVideoTrack = nil
    }
    
    // Делегат: подхватываем картинку зрителя
    nonisolated func room(_ room: Room, participant: RemoteParticipant, didSubscribe track: RemoteTrack, publication: RemoteTrackPublication) {
        if let videoTrack = track as? VideoTrack {
            Task { @MainActor in
                self.remoteVideoTrack = videoTrack
                print("🎥 Видео зрителя подхвачено!")
            }
        }
    }
}
