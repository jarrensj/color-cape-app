import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLanguage, LANGUAGES, LanguageCode } from '@/context/language-context';

type LanguageToggleProps = {
  style?: object;
};

export function LanguageToggle({ style }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === language);

  const handleSelect = (code: LanguageCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguage(code);
    setShowDropdown(false);
  };

  return (
    <>
      <Pressable
        style={[styles.toggle, style]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowDropdown(true);
        }}
      >
        <Text style={styles.toggleText}>{currentLang?.nativeLabel || 'EN'}</Text>
      </Pressable>

      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdown}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.dropdownItem,
                  language === lang.code && styles.dropdownItemActive,
                ]}
                onPress={() => handleSelect(lang.code)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    language === lang.code && styles.dropdownItemTextActive,
                  ]}
                >
                  {lang.nativeLabel}
                </Text>
                <Text style={styles.dropdownItemLabel}>{lang.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  dropdown: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dropdownItemTextActive: {
    color: '#5AC8FA',
  },
  dropdownItemLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 12,
  },
});
