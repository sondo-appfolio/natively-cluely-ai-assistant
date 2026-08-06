# iOS client is React Native

Supersedes ADR 0008 (SwiftUI native v1) for this personal companion effort.

The phone app is a **react-native-phone-mirror-client**: React Native on iOS (personal sideload), speaking Phone Mirror WS + knowledge-gateway HTTP. Desktop remains the session/intelligence host. We rejected Safari/WKWebView-as-product and (for this effort) SwiftUI, to share TypeScript protocol/client code with the Electron desktop and ease a later Android client. App Store–oriented SwiftUI rationale in ADR 0008 does not apply under **personal-sideload-only**.
