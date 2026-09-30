import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type ConversationAction = {
  key: string;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: ConversationAction[];
}

const ConversationActionsSheet: React.FC<Props> = ({ visible, onClose, title, actions }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {actions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={[styles.row, action.disabled && styles.rowDisabled]}
              disabled={action.disabled}
              onPress={() => {
                action.onPress();
                onClose();
              }}
            >
              <Text
                style={[
                  styles.label,
                  action.destructive && styles.destructive,
                  action.disabled && styles.labelDisabled,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.row, styles.cancelRow]} onPress={onClose}>
            <Text style={[styles.label, styles.cancelText]}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingVertical: 10,
  },
  title: {
    fontSize: 14,
    color: '#94a3b8',
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontWeight: '600',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  labelDisabled: {
    color: '#64748b',
  },
  destructive: {
    color: '#f87171',
  },
  cancelRow: {
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    marginTop: 6,
  },
  cancelText: {
    color: '#94a3b8',
  },
});

export default ConversationActionsSheet;
