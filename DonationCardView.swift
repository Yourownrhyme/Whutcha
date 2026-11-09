import SwiftUI
import AVKit

// MARK: - Donation Card
struct DonationCardView: View {
    let donation: Donation
    let supabaseURL: String
    @ObservedObject var viewModel: QueueViewModel
    
    @StateObject private var playerModel = CardPlayerModel()
    @State private var showCoStream = false
    
    // 🔥 Флаг для вызова экрана записи реакции
    @State private var showReactionMode = false
    
    // 🔥 Стейт для алерта бана
    @State private var showBanAlert = false
    
    // 🔥 Кешируем дату создания доната
    @State private var parsedDate: Date?
    
    // 🔥 Флаг блокировки для предотвращения спама запросами (DDoS)
    @State private var isProcessingTimer = false
    
    // 🔥 Вычисляем остаток времени на лету, используя единые часы из ViewModel
    private var timeRemaining: Int {
        guard let date = parsedDate else { return 900 } // 15 минут по умолчанию
        let elapsed = Int(viewModel.currentTime.timeIntervalSince(date))
        return max(0, 900 - elapsed)
    }
    
    let cardBackground = Color(red: 0.08, green: 0.08, blue: 0.12)
    let innerBackground = Color(red: 0.04, green: 0.04, blue: 0.06)
    let brandGradient = LinearGradient(colors: [Color(red: 0.6, green: 0.2, blue: 0.9), Color(red: 0.2, green: 0.8, blue: 0.9)], startPoint: .topLeading, endPoint: .bottomTrailing)
    let coStreamGradient = LinearGradient(colors: [Color(red: 0.2, green: 0.8, blue: 0.4), Color(red: 0.1, green: 0.6, blue: 0.9)], startPoint: .topLeading, endPoint: .bottomTrailing)
    
    private var isCoStreamRequest: Bool {
        donation.videoHash.lowercased().contains("costream")
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            
            // MARK: - HEADER (Юзер + SLA + Сумма)
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(isCoStreamRequest ? coStreamGradient : brandGradient)
                    
                    Text(String(donation.username.prefix(1)).uppercased())
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                }
                .frame(width: 48, height: 48)
                .shadow(color: (isCoStreamRequest ? Color.green : Color.purple).opacity(0.3), radius: 8, y: 4)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(donation.username)
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    
                    HStack(spacing: 4) {
                        Image(systemName: isCoStreamRequest ? "bolt.fill" : "video.fill")
                            .font(.system(size: 10))
                        Text(isCoStreamRequest ? "CO-STREAM" : "VIDEO MSG")
                            .font(.system(size: 11, weight: .black, design: .monospaced))
                    }
                    .foregroundColor(isCoStreamRequest ? .green : .cyan)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background((isCoStreamRequest ? Color.green : Color.cyan).opacity(0.15))
                    .clipShape(Capsule())
                }
                
                Spacer()
                
                // 🔥 Блок суммы и SLA Таймера
                VStack(alignment: .trailing, spacing: 6) {
                    Text("+$\(donation.amount, specifier: "%.2f")")
                        .font(.system(size: 20, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                    
                    // Тикающий таймер
                    HStack(spacing: 6) {
                        Image(systemName: "timer")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(timerColor)
                        
                        Text(timeString(from: timeRemaining))
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundColor(timerColor)
                    }
                    
                    // Прогресс бар
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.white.opacity(0.1))
                            Capsule().fill(timerColor)
                                .frame(width: max(0, geo.size.width * CGFloat(timeRemaining) / 900.0))
                                .animation(.linear(duration: 1.0), value: timeRemaining)
                        }
                    }
                    .frame(width: 60, height: 4)
                }
            }
            
            // MARK: - MEDIA CONTAINER (Ленивая загрузка)
            ZStack {
                innerBackground
                    .frame(height: 200)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.05), lineWidth: 1))
                
                if isCoStreamRequest {
                    VStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(coStreamGradient.opacity(0.15))
                                .frame(width: 70, height: 70)
                            Image(systemName: "video.badge.plus")
                                .font(.system(size: 28, weight: .medium))
                                .foregroundStyle(coStreamGradient)
                        }
                        VStack(spacing: 4) {
                            Text("Live Co-Stream Request")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text("Viewer is waiting in room")
                                .font(.system(size: 13))
                                .foregroundColor(.gray)
                        }
                    }
                } else {
                    if let player = playerModel.player {
                        ZStack {
                            IOSVideoPlayer(player: player)
                                .frame(height: 200)
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                .clipped()
                                .id(donation.id)
                            
                            Button(action: { playerModel.togglePlay() }) { Color.clear }
                            
                            if !playerModel.isPlaying {
                                Image(systemName: "play.fill")
                                    .font(.system(size: 50))
                                    .foregroundColor(.white.opacity(0.8))
                                    .shadow(color: .black.opacity(0.5), radius: 10)
                            }
                        }
                    } else {
                        Button(action: {
                            playerModel.setupAndPlay(videoHash: donation.videoHash, supabaseURL: supabaseURL)
                        }) {
                            ZStack {
                                Color.black.opacity(0.4)
                                    .frame(height: 200)
                                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                
                                Image(systemName: "play.circle.fill")
                                    .font(.system(size: 50))
                                    .foregroundColor(.cyan)
                                    .shadow(color: .cyan.opacity(0.5), radius: 15)
                            }
                        }
                    }
                }
            }
            
            // MARK: - ACTION BUTTONS
            HStack(spacing: 12) {
                
                // 🔥 КНОПКА БАНА
                Button(action: {
                    triggerHaptic(style: .heavy)
                    showBanAlert = true
                }) {
                    Image(systemName: "hammer.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.white)
                        .frame(width: 50, height: 50)
                        .background(Color.red.opacity(0.8))
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .alert("Ban this user?", isPresented: $showBanAlert) {
                    Button("Ban & Report", role: .destructive) {
                        Task {
                            if let uuid = UUID(uuidString: donation.id) {
                                await viewModel.rejectDonation(id: uuid)
                            }
                            if let deviceId = donation.deviceId {
                                await viewModel.banUser(deviceId: deviceId)
                            }
                        }
                    }
                    Button("Cancel", role: .cancel) {}
                } message: {
                    Text("They won't be able to send you requests anymore.")
                }

                actionButton(title: "Reject", icon: "xmark", color: .red) {
                    triggerHaptic(style: .medium)
                    Task {
                        if let uuid = UUID(uuidString: donation.id) {
                            await viewModel.rejectDonation(id: uuid)
                        }
                    }
                }
                
                if !isCoStreamRequest {
                    actionButton(title: "React", icon: "record.circle", color: .purple) {
                        triggerHaptic(style: .heavy)
                        showReactionMode = true
                    }
                    
                    // 🔥 КНОПКА "PLAY IN OBS"
                    actionButton(title: "Play in OBS", icon: "play.tv.fill", color: .cyan) {
                        triggerHaptic(style: .medium)
                        Task {
                            if let uuid = UUID(uuidString: donation.id) {
                                await viewModel.approveDonation(id: uuid)
                            }
                        }
                    }
                }
                
                if isCoStreamRequest {
                    Button(action: {
                        triggerHaptic(style: .heavy)
                        Task {
                            if let uuid = UUID(uuidString: donation.id) {
                                await viewModel.approveDonation(id: uuid)
                                showCoStream = true
                            }
                        }
                    }) {
                        HStack(spacing: 8) {
                            Image(systemName: "video.fill")
                                .font(.system(size: 14, weight: .bold))
                            Text("Accept & Join")
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(coStreamGradient)
                        .foregroundColor(.black)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .shadow(color: Color.green.opacity(0.3), radius: 8, y: 4)
                    }
                }
            }
        }
        .padding(20)
        .background(cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.white.opacity(0.05), lineWidth: 1))
        .shadow(color: Color.black.opacity(0.3), radius: 15, y: 8)
        .onAppear {
            parseDate()
        }
        .onDisappear {
            playerModel.cleanup()
        }
        // 🔥 ЛОГИКА ТАЙМЕРА (АВТО-РЕДЖЕКТ) ИСПОЛЬЗУЯ ЕДИНЫЕ ЧАСЫ (ИСПРАВЛЕН DDoS)
        .onChange(of: viewModel.currentTime) { _ in
            if timeRemaining <= 0 && !isProcessingTimer {
                isProcessingTimer = true // 🔥 Блокируем повторные вызовы
                Task {
                    if let uuid = UUID(uuidString: donation.id) {
                        await viewModel.rejectDonation(id: uuid)
                    }
                }
            }
        }
        .sheet(isPresented: $showCoStream) {
            CoStreamView(roomName: "room_\(donation.id)")
        }
        .fullScreenCover(isPresented: $showReactionMode) {
            ReactionView(videoHash: donation.videoHash, supabaseURL: supabaseURL)
        }
    }
    
    // MARK: - Вспомогательные функции таймера
    private var timerColor: Color {
        if timeRemaining < 300 { return .red }      // < 5 мин
        if timeRemaining < 600 { return .orange }   // < 10 мин
        return .green                               // > 10 мин
    }
    
    private func timeString(from seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%02d:%02d", m, s)
    }
    
    private func parseDate() {
        guard let createdAtStr = donation.createdAt else { return }
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: createdAtStr) ?? ISO8601DateFormatter().date(from: createdAtStr) {
            self.parsedDate = date
        }
    }
    
    // MARK: - Custom Button Builder
    private func actionButton(title: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .bold))
                Text(title)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }
    
    private func triggerHaptic(style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred()
    }
}
