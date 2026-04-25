import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface SignedActionModalProps {
  visible: boolean;
  title: string;
  description: string;
  riskLabel: string;
  details: string[];
  acknowledgementText: string;
  confirmationInput: string;
  errorMessage: string | null;
  submitting: boolean;
  onConfirmationInputChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SignedActionModal({
  visible,
  title,
  description,
  riskLabel,
  details,
  acknowledgementText,
  confirmationInput,
  errorMessage,
  submitting,
  onConfirmationInputChange,
  onConfirm,
  onCancel,
}: SignedActionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.riskPill}>
            <Text style={styles.riskText}>{riskLabel}</Text>
          </View>

          {details.length > 0 ? (
            <View style={styles.detailsContainer}>
              {details.map((detail) => (
                <Text key={detail} style={styles.detailRow}>
                  - {detail}
                </Text>
              ))}
            </View>
          ) : null}

          <Text style={styles.ackText}>
            Type <Text style={styles.ackKeyword}>{acknowledgementText}</Text> to
            continue.
          </Text>

          <TextInput
            value={confirmationInput}
            onChangeText={onConfirmationInputChange}
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={`Type ${acknowledgementText}`}
            placeholderTextColor="#9CA3AF"
            autoFocus
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.confirmBtn}
              onPress={onConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>Sign Action</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  riskPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  riskText: {
    color: "#991B1B",
    fontSize: 12,
    fontWeight: "700",
  },
  detailsContainer: {
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    color: "#374151",
    fontSize: 13,
    lineHeight: 18,
  },
  ackText: {
    color: "#4B5563",
    fontSize: 13,
    marginBottom: 8,
  },
  ackKeyword: {
    color: "#111827",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#F3F4F6",
  },
  cancelText: {
    color: "#374151",
    fontWeight: "600",
  },
  confirmBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#111827",
    minWidth: 100,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "700",
  },
});
