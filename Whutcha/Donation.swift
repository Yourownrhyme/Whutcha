import Foundation

struct Donation: Identifiable, Codable, Equatable {
    let id: String
    let username: String
    let amount: Double
    let videoHash: String
    var status: String?
    let createdAt: String?
    let deviceId: String? // 🔥 Добавили отпечаток браузера для банов
    
    enum CodingKeys: String, CodingKey {
        case id
        case username
        case amount
        case videoHash = "video_hash"
        case status
        case createdAt = "created_at"
        case deviceId = "device_id" // 🔥 Маппинг колонки из Supabase
    }
}
