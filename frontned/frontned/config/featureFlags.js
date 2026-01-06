export const FEATURE_FLAGS = {
  GEMINI_2_FLASH: 'GEMINI_2_FLASH'
};

export const DEFAULT_FEATURES = {
  [FEATURE_FLAGS.GEMINI_2_FLASH]: true
};

export const isFeatureEnabled = (featureName) => {
  return DEFAULT_FEATURES[featureName] ?? false;
};
