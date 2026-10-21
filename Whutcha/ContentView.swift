import SwiftUI

struct ContentView: View {
    // Получаем доступ к нашему менеджеру авторизации
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var viewModel = QueueViewModel()
    
    // Читаем системный ID стримера (больше не редактируем его)
    @AppStorage("streamerID") private var streamerID = ""
    
    // 🔥 Флаг отслеживания первого запуска для Онбординга
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    
    @State private var isDonationLinkCopied = false
    @State private var isOBSLinkCopied = false
    @State private var showWallet = false
    @State private var pulseSynced = false
    @State private var showDeleteAlert = false
    
    // 🔥 Флаг для показа пульта управления OBS
    @State private var showOBSControl = false
    
    var donationLink: String {
        return "\(AppConstants.baseWebURL)?streamer=\(streamerID)"
    }
    
    var obsOverlayLink: String {
        return "\(AppConstants.baseWebURL)overlay.html?streamer=\(streamerID)"
    }
    
    let darkBackground = Color(red: 0.05, green: 0.05, blue: 0.08)
    let cardBackground = Color(red: 0.1, green: 0.1, blue: 0.15)
    
    var body: some View {
        TabView {
            NavigationStack {
                queueView
                    .navigationTitle("Review Queue")
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(Color.cyan)
                                    .frame(width: 8, height: 8)
                                    .shadow(color: .cyan, radius: pulseSynced ? 4 : 0)
                                    .scaleEffect(pulseSynced ? 1.2 : 1.0)
                                    .animation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true), value: pulseSynced)
                                
                                Text("SYNCED")
                                    .font(.system(size: 11, weight: .black, design: .monospaced))
                                    .foregroundColor(.cyan)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.cyan.opacity(0.1))
                            .clipShape(Capsule())
                            .overlay(Capsule().stroke(Color.cyan.opacity(0.3), lineWidth: 1))
                            .onAppear { pulseSynced = true }
                        }
                    }
                    .toolbarBackground(darkBackground, for: .navigationBar)
                    .toolbarColorScheme(.dark, for: .navigationBar)
            }
            .tabItem {
                Label("Queue", systemImage: "play.rectangle.on.rectangle.fill")
            }
            
            NavigationStack {
                dashboardView
                    .navigationTitle("Dashboard")
                    .toolbarBackground(darkBackground, for: .navigationBar)
                    .toolbarColorScheme(.dark, for: .navigationBar)
            }
            .tabItem {
                Label("Dashboard", systemImage: "bolt.horizontal.circle.fill")
            }
        }
        .preferredColorScheme(.dark)
        .tint(.cyan)
        // 🔥 ВЫЗОВ ЭКРАНА ОНБОРДИНГА
        .fullScreenCover(isPresented: Binding(
            get: { !hasSeenOnboarding },
            set: { _ in }
        )) {
            OnboardingView()
        }
    }
    
    private var queueView: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                if viewModel.donations.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "sparkles.tv")
                            .font(.system(size: 50, weight: .light))
                            .foregroundColor(.cyan.opacity(0.6))
                        Text("Queue is clear")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                        Text("Waiting for viewers to drop something...")
                            .font(.system(size: 14))
                            .foregroundColor(.gray)
                    }
                    .padding(.top, 150)
                } else {
                    ForEach(viewModel.donations, id: \.id) { donation in
                        // 🔥 ИСПРАВЛЕНИЕ: передаем supabaseURL как String через .absoluteString
                        DonationCardView(donation: donation, supabaseURL: AppConstants.supabaseURL.absoluteString, viewModel: viewModel)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 20)
        }
        .background(darkBackground.edgesIgnoringSafeArea(.all))
        .onAppear {
            viewModel.fetchQueue()
        }
        .onDisappear {
            viewModel.stopListening()
        }
    }
    
    private var dashboardView: some View {
        ScrollView {
            VStack(spacing: 20) {
                
                // КАРТОЧКА 1: ЗАЩИЩЕННЫЙ ID
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        Image(systemName: "lock.shield.fill")
                            .foregroundColor(.cyan)
                        Text("Your Unique Streamer ID")
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    
                    Text("This secure database identifier connects viewers to your specific queue.")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    
                    Text(streamerID)
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundColor(.gray)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.black.opacity(0.4))
                        .cornerRadius(10)
                }
                .padding(20)
                .background(cardBackground)
                .cornerRadius(20)
                
                // КАРТОЧКА 2: ДОНАТЫ
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "link.badge.plus")
                            .foregroundColor(.purple)
                        Text("Donation Link (For Viewers)")
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    
                    Text("Place this link in your Twitch chat or YouTube description.")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    
                    HStack {
                        Text(donationLink)
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(.purple)
                            .lineLimit(1)
                            .truncationMode(.middle)
                        
                        Spacer()
                        
                        Button(action: {
                            UIPasteboard.general.string = donationLink
                            triggerHaptic()
                            withAnimation(.spring()) { isDonationLinkCopied = true }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                withAnimation { isDonationLinkCopied = false }
                            }
                        }) {
                            Image(systemName: isDonationLinkCopied ? "checkmark" : "doc.on.doc.fill")
                                .foregroundColor(isDonationLinkCopied ? .green : .white)
                                .frame(width: 38, height: 38)
                                .background(isDonationLinkCopied ? Color.green.opacity(0.2) : Color.purple)
                                .clipShape(Circle())
                        }
                    }
                    .padding(12)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(12)
                }
                .padding(20)
                .background(cardBackground)
                .cornerRadius(20)
                
                // КАРТОЧКА 3: OBS ОВЕРЛЕЙ
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "display")
                            .foregroundColor(.cyan)
                        Text("OBS Browser Source Link")
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    
                    Text("Add this URL as a Browser Source in OBS (1920x1080) to display approved donations.")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    
                    HStack {
                        Text(obsOverlayLink)
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(.cyan)
                            .lineLimit(1)
                            .truncationMode(.middle)
                        
                        Spacer()
                        
                        Button(action: {
                            UIPasteboard.general.string = obsOverlayLink
                            triggerHaptic()
                            withAnimation(.spring()) { isOBSLinkCopied = true }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                withAnimation { isOBSLinkCopied = false }
                            }
                        }) {
                            Image(systemName: isOBSLinkCopied ? "checkmark" : "doc.on.doc.fill")
                                .foregroundColor(isOBSLinkCopied ? .green : .black)
                                .frame(width: 38, height: 38)
                                .background(isOBSLinkCopied ? Color.green.opacity(0.2) : Color.cyan)
                                .clipShape(Circle())
                        }
                    }
                    .padding(12)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(12)
                    
                    // 🔥 КНОПКА КАСТОМИЗАЦИИ OBS
                    Button(action: { showOBSControl = true }) {
                        HStack {
                            Image(systemName: "slider.horizontal.3")
                            Text("Customize Overlay")
                        }
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.cyan)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.cyan.opacity(0.1))
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.cyan.opacity(0.3), lineWidth: 1))
                    }
                }
                .padding(20)
                .background(cardBackground)
                .cornerRadius(20)
                // 🔥 ВЫЗОВ ЭКРАНА НАСТРОЕК OBS
                .sheet(isPresented: $showOBSControl) {
                    OBSControlView()
                }
                
                // КАРТОЧКА 4: КОШЕЛЕК
                Button(action: { showWallet = true }) {
                    HStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient(colors: [.green, .teal], startPoint: .topLeading, endPoint: .bottomTrailing))
                                .frame(width: 48, height: 48)
                            Image(systemName: "dollarsign")
                                .foregroundColor(.white)
                                .font(.system(size: 20, weight: .bold))
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Earnings & Payouts")
                                .font(.headline)
                                .foregroundColor(.white)
                            Text("Check balance and withdraw funds")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.gray)
                    }
                    .padding(20)
                    .background(cardBackground)
                    .cornerRadius(20)
                }
                .sheet(isPresented: $showWallet) {
                    WalletView()
                }
                
                // КАРТОЧКА 5: УПРАВЛЕНИЕ АККАУНТОМ
                VStack(spacing: 12) {
                    Button(action: {
                        authManager.signOut()
                    }) {
                        Text("Sign Out")
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.gray.opacity(0.3))
                            .cornerRadius(12)
                    }
                    
                    Button(action: {
                        showDeleteAlert = true
                    }) {
                        Text("Delete Account")
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(12)
                    }
                }
                .padding(.top, 10)
                
            }
            .padding(16)
        }
        .background(darkBackground.edgesIgnoringSafeArea(.all))
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Account"),
                message: Text("This action cannot be undone. Your balance and pending queue will be permanently lost."),
                primaryButton: .destructive(Text("Delete")) {
                    Task {
                        await authManager.deleteAccount()
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
    
    private func triggerHaptic() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
    }
}
