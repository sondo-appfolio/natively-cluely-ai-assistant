# iOS v1 client is native SwiftUI

**Status:** superseded by ADR 0013 for the personal Phone Mirror companion (React Native).

**swiftui-native-v1**: the first App Store client is native SwiftUI with Apple audio/speech APIs. We rejected React Native / Flutter wraps of the desktop overlay and Mac Catalyst-as-the-iPhone-app, to keep mic permission honesty, background-audio behavior, and App Review surface aligned with Apple’s stack. Shared intelligence stays cloud/TS-side (`cloud-llm-byok-first`), not a full Electron port into Swift.
