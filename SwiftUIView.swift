import SwiftUI

struct WalletTestView: View {
    @State private var showWallet = false
    
    var body: some View {
        ZStack {
            Color.black.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 20) {
                Text("Экран тестирования кассы")
                    .font(.title2)
                    .foregroundColor(.white)
                    .bold()
                
                Button(action: {
                    showWallet = true
                }) {
                    HStack {
                        Image(systemName: "creditcard.fill")
                        Text("Открыть Кошелек")
                    }
                    .font(.headline)
                    .foregroundColor(.black)
                    .padding()
                    .background(Color.yellow)
                    .cornerRadius(12)
                }
            }
        }
        .sheet(isPresented: $showWallet) {
            WalletView()
        }
    }
}

#Preview {
    WalletTestView()
}
