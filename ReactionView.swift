import SwiftUI
import AVKit

struct ReactionView: View {
    let videoHash: String
    let supabaseURL: String
    
    @StateObject private var reactionManager = ReactionManager()
    @StateObject private var playerModel = CardPlayerModel()
    @Environment(\.dismiss) var dismiss
    
    // Для плавающего окна (Картинка в картинке)
    @State private var pipPosition: CGSize = CGSize(width: 80, height: -200)
    @State private var dragOffset: CGSize = .zero
    
    // Для таймера
    @State private var timeElapsed: CGFloat = 0.0
    let maxTime: CGFloat = 15.0
    let timer = Timer.publish(every: 0.1, on: .main, in: .common).autoconnect()
    
    // 🔥 Флаг показа меню "Поделиться"
    @State private var showShareSheet = false
    
    var body: some View {
        ZStack {
            // 1. ПОЛНОЭКРАННАЯ ФРОНТАЛЬНАЯ КАМЕРА
            Color.black.edgesIgnoringSafeArea(.all)
            CameraPreviewView(session: reactionManager.session)
                .edgesIgnoringSafeArea(.all)
            
            // 2. ПЛАВАЮЩЕЕ ОКНО (Видео зрителя)
            if let player = playerModel.player {
                IOSVideoPlayer(player: player)
                    .frame(width: 140, height: 250)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .shadow(color: .black.opacity(0.6), radius: 15, x: 0, y: 10)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.3), lineWidth: 2))
                    .offset(x: pipPosition.width + dragOffset.width, y: pipPosition.height + dragOffset.height)
                    .gesture(
                        DragGesture()
                            .onChanged { value in self.dragOffset = value.translation }
                            .onEnded { value in
                                self.pipPosition.width += value.translation.width
                                self.pipPosition.height += value.translation.height
                                self.dragOffset = .zero
                            }
                    )
                    .animation(.spring(response: 0.3, dampingFraction: 0.8), value: dragOffset == .zero)
            } else {
                RoundedRectangle(cornerRadius: 16).fill(Color.black.opacity(0.8))
                    .frame(width: 140, height: 250)
                    .overlay(ProgressView().tint(.cyan))
                    .offset(x: pipPosition.width, y: pipPosition.height)
            }
            
            // 3. ИНТЕРФЕЙС
            VStack {
                if reactionManager.isRecording {
                    VStack(spacing: 8) {
                        ProgressView(value: timeElapsed, total: maxTime)
                            .progressViewStyle(LinearProgressViewStyle(tint: .red))
                            .scaleEffect(x: 1, y: 2, anchor: .center)
                            .padding(.horizontal, 40)
                        
                        Text("00:\(String(format: "%02d", Int(maxTime - timeElapsed)))")
                            .font(.system(size: 16, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                            .shadow(color: .black, radius: 2)
                    }
                    .padding(.top, 50)
                    .transition(.move(edge: .top).combined(with: .opacity))
                } else {
                    HStack {
                        Spacer()
                        Button(action: {
                            playerModel.cleanup()
                            dismiss()
                        }) {
                            Image(systemName: "xmark")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 44, height: 44)
                                .background(Color.black.opacity(0.5))
                                .clipShape(Circle())
                        }
                        .padding(.top, 50)
                        .padding(.trailing, 20)
                    }
                }
                
                Spacer()
                
                // Скрываем кнопку записи, если меню "Поделиться" уже вызвано
                if !showShareSheet {
                    Button(action: toggleRecording) {
                        ZStack {
                            Circle().stroke(Color.white.opacity(0.8), lineWidth: 4).frame(width: 80, height: 80)
                            if reactionManager.isRecording {
                                RoundedRectangle(cornerRadius: 8).fill(Color.red).frame(width: 32, height: 32)
                            } else {
                                Circle().fill(Color.red).frame(width: 64, height: 64)
                            }
                        }
                    }
                    .padding(.bottom, 40)
                }
            }
            
            // 🔥 ПЛАШКА СТАТУСА (Рендеринг / Готово)
            if reactionManager.isExporting {
                VStack {
                    Spacer()
                    HStack(spacing: 12) {
                        ProgressView().tint(.white)
                        Text("Minting Reaction...")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.purple)
                    .clipShape(Capsule())
                    .shadow(radius: 10)
                    .padding(.bottom, 140)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            } else if reactionManager.savedSuccessfully && !showShareSheet {
                VStack {
                    Spacer()
                    Text("Saved! Opening Share Menu... 🚀")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Color.green)
                        .clipShape(Capsule())
                        .shadow(radius: 10)
                        .padding(.bottom, 140)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .onAppear {
            reactionManager.checkPermissionsAndSetup()
            playerModel.setupAndPlay(videoHash: videoHash, supabaseURL: supabaseURL)
            playerModel.player?.pause()
        }
        .onDisappear {
            playerModel.cleanup()
        }
        .onReceive(timer) { _ in
            if reactionManager.isRecording {
                if timeElapsed < maxTime { timeElapsed += 0.1 }
                else { toggleRecording() } // Авто-стоп
            }
        }
        // 🔥 СЛУШАЕМ ПОЯВЛЕНИЕ ГОТОВОГО ФАЙЛА
        .onChange(of: reactionManager.recordedFileURL) { url in
            if url != nil {
                // Как только URL получен — показываем Share Sheet
                showShareSheet = true
            }
        }
        // 🔥 ВЫЗЫВАЕМ SHARE SHEET
        .sheet(isPresented: $showShareSheet) {
            if let fileURL = reactionManager.recordedFileURL {
                ShareSheet(activityItems: [fileURL]) {
                    // Код, который сработает, когда стример закроет меню "Поделиться"
                    let generator = UINotificationFeedbackGenerator()
                    generator.notificationOccurred(.success)
                    playerModel.cleanup()
                    dismiss() // Закрываем экран реакции и возвращаемся в очередь
                }
                // Игнорируем безопасную зону, чтобы шторка вылезала на весь экран (iOS 16+)
                .presentationDetents([.medium, .large])
            }
        }
    }
    
    // 🔥 ОБНОВЛЕННЫЙ ВЫЗОВ ЗАПИСИ
    private func toggleRecording() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
        
        withAnimation(.easeInOut(duration: 0.2)) {
            if reactionManager.isRecording {
                reactionManager.stopRecording()
                playerModel.player?.pause()
            } else {
                timeElapsed = 0.0
                
                // 🔥 Вытаскиваем URL видео доната из плеера и передаем в менеджер
                let asset = playerModel.player?.currentItem?.asset as? AVURLAsset
                let viewerURL = asset?.url
                
                reactionManager.startRecording(viewerURL: viewerURL)
                
                playerModel.player?.seek(to: .zero)
                playerModel.player?.play()
            }
        }
    }
}
