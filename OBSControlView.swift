import SwiftUI

struct OBSControlView: View {
    @AppStorage("streamerID") private var streamerID = ""
    @StateObject private var overlayManager = OverlayManager()
    @Environment(\.dismiss) var dismiss
    
    let appBackground = Color(red: 0.04, green: 0.04, blue: 0.06)
    let panelBackground = Color(red: 0.08, green: 0.08, blue: 0.12)
    let brandGradient = LinearGradient(colors: [Color(red: 0.2, green: 0.8, blue: 0.9), Color(red: 0.6, green: 0.2, blue: 0.9)], startPoint: .topLeading, endPoint: .bottomTrailing)
    
    let positions = [
        "top-left": "Top Left",
        "top-right": "Top Right",
        "bottom-left": "Bottom Left",
        "bottom-right": "Bottom Right"
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                appBackground.edgesIgnoringSafeArea(.all)
                
                VStack(spacing: 30) {
                    
                    // MARK: - ПРЕВЬЮ ЭКРАНА (16:9)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("STREAM PREVIEW")
                            .font(.system(size: 12, weight: .black, design: .monospaced))
                            .foregroundColor(.gray)
                        
                        GeometryReader { geo in
                            ZStack {
                                // Фон фейкового стрима
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.black)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                    )
                                    .overlay(
                                        Image(systemName: "gamecontroller.fill")
                                            .font(.system(size: 60))
                                            .foregroundColor(.white.opacity(0.05))
                                    )
                                
                                // Фейковый виджет доната, который реагирует на размер и позицию
                                VStack(spacing: 4) {
                                    HStack(spacing: 4) {
                                        Circle().fill(brandGradient).frame(width: 12, height: 12)
                                        RoundedRectangle(cornerRadius: 4).fill(Color.white).frame(width: 40, height: 8)
                                    }
                                    RoundedRectangle(cornerRadius: 6).fill(Color.white.opacity(0.2)).frame(width: 60, height: 30)
                                }
                                .padding(8)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(8)
                                .scaleEffect(overlayManager.scale) // Анимация размера
                                .animation(.spring(), value: overlayManager.scale)
                                .position(previewPosition(for: overlayManager.position, in: geo.size)) // Анимация позиции
                                .animation(.spring(response: 0.4, dampingFraction: 0.7), value: overlayManager.position)
                            }
                        }
                        .aspectRatio(16/9, contentMode: .fit) // Жестко держим пропорции
                    }
                    .padding(.horizontal, 20)
                    
                    // MARK: - УПРАВЛЕНИЕ ПОЗИЦИЕЙ
                    VStack(alignment: .leading, spacing: 12) {
                        Text("WIDGET POSITION")
                            .font(.system(size: 12, weight: .black, design: .monospaced))
                            .foregroundColor(.gray)
                            .padding(.horizontal, 20)
                        
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(["top-left", "top-right", "bottom-left", "bottom-right"], id: \.self) { pos in
                                positionButton(pos)
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    
                    // MARK: - УПРАВЛЕНИЕ РАЗМЕРОМ
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("WIDGET SCALE")
                                .font(.system(size: 12, weight: .black, design: .monospaced))
                                .foregroundColor(.gray)
                            Spacer()
                            Text("\(overlayManager.scale, specifier: "%.1f")x")
                                .font(.system(size: 14, weight: .bold, design: .monospaced))
                                .foregroundColor(.cyan)
                        }
                        .padding(.horizontal, 20)
                        
                        Slider(value: $overlayManager.scale, in: 0.5...2.0, step: 0.1)
                            .tint(.cyan)
                            .padding(.horizontal, 20)
                            .onChange(of: overlayManager.scale) { _ in
                                triggerHaptic()
                            }
                    }
                    
                    Spacer()
                    
                    // MARK: - КНОПКА СОХРАНИТЬ
                    Button(action: {
                        Task {
                            triggerHaptic(style: .heavy)
                            await overlayManager.saveSettings(streamerID: streamerID)
                            dismiss()
                        }
                    }) {
                        HStack {
                            if overlayManager.isSaving {
                                ProgressView().tint(.white)
                            } else {
                                Text("Save & Apply to OBS")
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(brandGradient)
                        .cornerRadius(14)
                        .shadow(color: Color(red: 0.2, green: 0.8, blue: 0.9).opacity(0.4), radius: 10, y: 5)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                    .disabled(overlayManager.isSaving)
                }
                .padding(.top, 20)
            }
            .navigationTitle("OBS Layout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundColor(.gray)
                }
            }
            .task {
                await overlayManager.fetchSettings(streamerID: streamerID)
            }
        }
        .preferredColorScheme(.dark)
    }
    
    // Вспомогательная функция для генерации кнопок позиции
    private func positionButton(_ id: String) -> some View {
        let isSelected = overlayManager.position == id
        return Button(action: {
            withAnimation { overlayManager.position = id }
            triggerHaptic()
        }) {
            Text(positions[id] ?? id)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(isSelected ? .white : .gray)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(isSelected ? Color.cyan.opacity(0.2) : panelBackground)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isSelected ? Color.cyan : Color.white.opacity(0.05), lineWidth: 1)
                )
        }
    }
    
    // Вспомогательная функция для расчета позиции на фейковом экране
    private func previewPosition(for pos: String, in size: CGSize) -> CGPoint {
        let padding: CGFloat = 40
        switch pos {
        case "top-left": return CGPoint(x: padding, y: padding)
        case "top-right": return CGPoint(x: size.width - padding, y: padding)
        case "bottom-left": return CGPoint(x: padding, y: size.height - padding)
        default: return CGPoint(x: size.width - padding, y: size.height - padding) // bottom-right
        }
    }
    
    private func triggerHaptic(style: UIImpactFeedbackGenerator.FeedbackStyle = .light) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred()
    }
}
