import React from "react";
import renderer, { act } from "react-test-renderer";
import { Pressable } from "react-native";

import PaymentConfirmationScreen from "../app/payment-confirmation";
import WalletConnectScreen from "../app/wallet-connect";

const mockAuthenticateForSensitiveAction = jest.fn();
const mockGetSensitiveSessionToken = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({
    username: "alice",
    amount: "10",
    asset: "USDC",
    memo: "invoice",
    privacy: "true",
  }),
}));

jest.mock("expo-linking", () => ({
  canOpenURL: jest.fn(async () => false),
  openURL: jest.fn(async () => undefined),
}));

jest.mock("../hooks/use-security", () => ({
  useSecurity: () => ({
    authenticateForSensitiveAction: mockAuthenticateForSensitiveAction,
    clearSensitiveSessionToken: jest.fn(async () => undefined),
    getSensitiveSessionToken: mockGetSensitiveSessionToken,
    saveSensitiveSessionToken: jest.fn(async () => undefined),
  }),
}));

jest.mock("../hooks/use-network-status", () => ({
  useNetworkStatus: () => ({ isConnected: true }),
}));

jest.mock("../hooks/usePaymentListener", () => ({
  usePaymentListener: jest.fn(),
}));

describe("signed action prompts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateForSensitiveAction.mockResolvedValue(true);
    mockGetSensitiveSessionToken.mockResolvedValue("qex_session_test_1234");
  });

  it("requires a signed action prompt before wallet payment", async () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<PaymentConfirmationScreen />);
    });

    // @ts-expect-error assigned in act
    const allPressables = tree.root.findAllByType(Pressable);
    const payButton = allPressables[0];

    await act(async () => {
      await payButton.props.onPress();
    });

    expect(mockAuthenticateForSensitiveAction).toHaveBeenCalledWith(
      "payment_authorization",
      expect.objectContaining({
        title: "Signed Action Required",
        riskLabel: "HIGH RISK: FUNDS TRANSFER",
        acknowledgementText: "SIGN",
      }),
    );
  });

  it("requires a signed action prompt before revealing secure token", async () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<WalletConnectScreen />);
    });

    // @ts-expect-error assigned in act
    const allPressables = tree.root.findAllByType(Pressable);
    const connectButton = allPressables[1];

    await act(async () => {
      await connectButton.props.onPress();
    });

    // @ts-expect-error assigned in act
    const postConnectPressables = tree.root.findAllByType(Pressable);
    const revealTokenButton = postConnectPressables[2];

    await act(async () => {
      await revealTokenButton.props.onPress();
    });

    expect(mockAuthenticateForSensitiveAction).toHaveBeenCalledWith(
      "sensitive_data_access",
      expect.objectContaining({
        title: "Signed Action Required",
        riskLabel: "HIGH RISK: SENSITIVE DATA",
        acknowledgementText: "SIGN",
      }),
    );
  });
});
