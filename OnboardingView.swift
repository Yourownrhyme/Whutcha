import SwiftUI

struct OnboardingView: View {
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    @State private var currentPage = 0
    
    let appBackground = Color(red: 0.04, green: 0.04, blue: 0.06)
    let brandGradient = LinearGradient(colors: [Color(red: 0.6, green: 0.2, blue: 0.9), Color(red: 0.2, green: 0.8, blue: 0.9)], startPoint: .topLeading, endPoint: .bottomTrailing)
    let greenGradient = LinearGradient(colors: [Color(red: 0.2, green: 0.8, blue: 0.4), Color(red: 0.1, green: 0.6, blue: 0.9)], startPoint: .topLeading, endPoint: .bottomTrailing)
    
    var body: some View {
        ZStack {
            appBackground.edgesIgnoringSafeArea(.all)
            
            // Фоновое свечение
            Circle()
                .fill(brandGradient.opacity(0.15))
                .frame(width: 300, height: 300)
                .blur(radius: 60)
                .offset(x: currentPage == 0 ? 100 : -100, y: -200)
                .animation(.easeInOut(duration: 1.0), value: currentPage)
            
            VStack {
                TabView(selection: $currentPage) {
                    
                    // ЭКРАН 1: Приветствие
                    OnboardingPage(
                        icon: "sparkles.tv",
                        iconColor: .cyan,
                        title: "Welcome to Whutcha",
                        description: "The ultimate viewer-interaction platform. Say goodbye to boring text donations and hello to raw emotions."
                    ).tag(0)
                    
                    // ЭКРАН 2: Механика
                    OnboardingPage(
                        icon: "video.badge.plus",
                        iconColor: .purple,
                        title: "Video & Co-Streams",
                        description: "Viewers drop 15-second videos or jump into live WebRTC co-streams directly on your OBS. You control the queue."
                    ).tag(1)
                    
                    // ЭКРАН 3: Деньги
                    OnboardingPage(
                        icon: "dollarsign.circle.fill",
                        iconColor: .green,
                        title: "Zero Apple Tax",
                        description: "Viewers pay via your personal link (DonationAlerts, PayPal, Ko-Fi). We don't touch your money! ⚠️ IMPORTANT: Always check your live stream alerts to verify the payment actually dropped before hitting 'Approve' in Whutcha!"
                    ).tag(2)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .always))
                
                // Кнопка навигации
                Button(action: {
                    if currentPage < 2 {
                        withAnimation { currentPage += 1 }
                        triggerHaptic(style: .light)
                    } else {
                        triggerHaptic(style: .heavy)
                        withAnimation(.spring()) {
                            hasSeenOnboarding = true
                        }
                    }
                }) {
                    Text(currentPage < 2 ? "Next" : "Let's Go")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        // 🔥 Спрятали конфликт типов в AnyShapeStyle
                        .background(currentPage < 2 ? AnyShapeStyle(Color.white.opacity(0.1)) : AnyShapeStyle(brandGradient))
                        .cornerRadius(16)
                        .shadow(color: currentPage < 2 ? .clear : Color(red: 0.6, green: 0.2, blue: 0.9).opacity(0.4), radius: 10, y: 5)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.white.opacity(currentPage < 2 ? 0.2 : 0), lineWidth: 1)
                        )
                }
                .padding(.horizontal, 30)
                .padding(.bottom, 40)
            }
        }
    }
    
    private func triggerHaptic(style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred()
    }
}

// Переиспользуемый компонент страницы
struct OnboardingPage: View {
    let icon: String
    let iconColor: Color
    let title: String
    let description: String
    
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            ZStack {
                Circle()
                    .fill(iconColor.opacity(0.15))
                    .frame(width: 120, height: 120)
                
                Image(systemName: icon)
                    .font(.system(size: 50, weight: .thin))
                    .foregroundColor(iconColor)
            }
            .padding(.bottom, 20)
            
            Text(title)
                .font(.system(size: 28, weight: .heavy, design: .rounded))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
            
            Text(description)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
                .lineSpacing(4)
            
            Spacer()
            Spacer()
        }
    }
}
