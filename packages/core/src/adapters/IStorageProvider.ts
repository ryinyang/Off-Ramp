export interface IStorageProvider {
  /**
   * Save serialized state payload to persistent local storage.
   */
  save(key: string, value: string): Promise<void>;

  /**
   * Load serialized state payload from persistent local storage.
   */
  load(key: string): Promise<string | null>;
}
