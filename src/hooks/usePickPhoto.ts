import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

/** Opens the photo library with a square crop. Resolves to the picked image URI, or null if cancelled. */
export function usePickPhoto() {
  return useCallback(async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return null;
    return result.assets[0]?.uri ?? null;
  }, []);
}
