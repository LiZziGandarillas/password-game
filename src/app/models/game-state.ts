export interface GameState {
  captchaValue?: string;
  currentTime: Date;
  emojiPhase?: boolean;
  moonPhase?: string;
  sacrificePhase?: boolean;
  sacrificedLetter?: string;
}
