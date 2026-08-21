import AsyncStorage from "@react-native-async-storage/async-storage";
import { IStorageProvider } from "@off-ramp/core";

export class MobileStorage implements IStorageProvider {
  public async save(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  public async load(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }
}
