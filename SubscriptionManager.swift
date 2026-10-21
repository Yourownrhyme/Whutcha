import Foundation
import StoreKit
import SwiftUI

@MainActor
class SubscriptionManager: ObservableObject {
    @Published var isSubscribed: Bool = false
    @Published var proProduct: Product?
    @Published var isLoading: Bool = false
    
    // Тот самый ID из твоего WhutchaStore.storekit
    let productID = "com.cjnight.whutcha.pro.monthly"
    
    private var updates: Task<Void, Never>? = nil
    
    init() {
        // Запускаем слушатель транзакций в фоне
        updates = newTransactionListenerTask()
        Task {
            await fetchProducts()
            await updateSubscriptionStatus()
        }
    }
    
    deinit {
        updates?.cancel()
    }
    
    private func newTransactionListenerTask() -> Task<Void, Never> {
        Task(priority: .background) { [weak self] in
            // 🔥 Указали StoreKit.Transaction явно
            for await verificationResult in StoreKit.Transaction.updates {
                self?.handle(updatedTransaction: verificationResult)
            }
        }
    }
    
    func fetchProducts() async {
        do {
            let products = try await Product.products(for: [productID])
            self.proProduct = products.first
        } catch {
            print("❌ Ошибка загрузки продуктов: \(error)")
        }
    }
    
    func purchase() async {
        guard let product = proProduct else { return }
        isLoading = true
        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verificationResult):
                handle(updatedTransaction: verificationResult)
            case .userCancelled, .pending:
                break
            @unknown default:
                break
            }
        } catch {
            print("❌ Ошибка покупки: \(error)")
        }
        isLoading = false
    }
    
    func updateSubscriptionStatus() async {
        var hasActiveSubscription = false
        // 🔥 Указали StoreKit.Transaction явно
        for await result in StoreKit.Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                if transaction.productType == .autoRenewable && transaction.revocationDate == nil {
                    hasActiveSubscription = true
                }
            }
        }
        self.isSubscribed = hasActiveSubscription
    }
    
    // 🔥 Указали StoreKit.Transaction явно
    private func handle(updatedTransaction verificationResult: VerificationResult<StoreKit.Transaction>) {
        guard case .verified(let transaction) = verificationResult else { return }
        
        if transaction.revocationDate == nil {
            self.isSubscribed = true
        } else {
            self.isSubscribed = false
        }
        
        Task {
            await transaction.finish()
        }
    }
    
    func restorePurchases() async {
        isLoading = true
        do {
            try await AppStore.sync()
        } catch {
            print("❌ Ошибка восстановления: \(error)")
        }
        await updateSubscriptionStatus()
        isLoading = false
    }
}
