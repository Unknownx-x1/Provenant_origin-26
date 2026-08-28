/**
 * PROVENANT Vault firmware for M5StickC Plus2.
 *
 * The backend is authoritative. This device polls a single state endpoint and
 * renders its state, countdown, hash, and metrics verbatim. It never computes
 * lock expiry, decides that a result may be revealed, or mutates Vault state.
 */

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <M5StickCPlus2.h>
#include <Preferences.h>
#include <WiFi.h>

#include <cstring>

#include "vault_config.h"

namespace {

constexpr uint32_t kPollIntervalMs = 1500;
constexpr uint32_t kWifiRetryIntervalMs = 10000;
constexpr uint32_t kVerifiedScreenDurationMs = 3000;

// The four active experiment values directly mirror the server's `state`
// field. WAITING is only an idle presentation state; it never alters an
// experiment or determines whether a lock is valid.
enum class DisplayState {
  WAITING,
  COMMITTING,
  LOCKED,
  REVEALING,
  VERIFIED,
  RECONNECTING,
};

DisplayState displayState = DisplayState::WAITING;
String commitHashShort;
String oosSharpe;
String pValue;
bool backendConnected = false;
bool verifiedAcknowledged = false;
uint32_t verifiedAt = 0;
Preferences preferences;
String previousStatus = "NONE";
String previousExperiment = "--";
String previousHash = "--";
String previousOosSharpe;
String previousPValue;
int secondsRemaining = 0;
uint32_t lastPollAt = 0;
uint32_t lastWifiAttemptAt = 0;
bool screenIsDrawn = false;
DisplayState lastRenderedState = DisplayState::RECONNECTING;
String lastRenderedHash;
String lastRenderedOosSharpe;
String lastRenderedPValue;
String lastRenderedCountdown;
bool lastRenderedBackendConnected = false;
String lastRenderedPreviousStatus;
String lastRenderedPreviousExperiment;
String lastRenderedPreviousHash;
String lastRenderedPreviousOosSharpe;
String lastRenderedPreviousPValue;

String stateUrl() {
  return String(VAULT_BACKEND_BASE_URL) + "/vault/state/" + VAULT_EXPERIMENT_ID;
}

String experimentLabel() {
  String id = VAULT_EXPERIMENT_ID;
  if (id.startsWith("exp-")) {
    id.remove(0, 4);
    return "EXP #" + id;
  }
  return "EXP " + id;
}

String formatCountdown(int totalSeconds) {
  // Formatting the server-supplied value is presentation only; it is not a
  // local timer and is never decremented between polls.
  const int minutes = totalSeconds / 60;
  const int seconds = totalSeconds % 60;
  char buffer[8];
  snprintf(buffer, sizeof(buffer), "%02d:%02d", minutes, seconds);
  return String(buffer);
}

void title(const char* text, uint16_t color) {
  StickCP2.Display.fillScreen(TFT_BLACK);
  StickCP2.Display.setTextDatum(top_center);
  StickCP2.Display.setTextColor(color, TFT_BLACK);
  StickCP2.Display.setTextSize(1);
  StickCP2.Display.drawString(text, StickCP2.Display.width() / 2, 8, 2);
}

void drawCommit() {
  title("NEW EXPERIMENT", TFT_YELLOW);
  StickCP2.Display.setTextColor(TFT_YELLOW, TFT_BLACK);
  StickCP2.Display.drawString(experimentLabel(), StickCP2.Display.width() / 2, 50, 2);
  StickCP2.Display.drawString("COMMITTING...", StickCP2.Display.width() / 2, 90, 2);
}

void drawWaiting() {
  title("VAULT READY", TFT_CYAN);
  StickCP2.Display.setTextColor(TFT_CYAN, TFT_BLACK);
  StickCP2.Display.drawString("WAITING FOR EXPERIMENT", StickCP2.Display.width() / 2, 37, 2);
  StickCP2.Display.setTextColor(backendConnected ? TFT_GREEN : TFT_ORANGE, TFT_BLACK);
  StickCP2.Display.drawString(backendConnected ? "BACKEND: CONNECTED" : "BACKEND: CONNECTING",
                               StickCP2.Display.width() / 2, 65, 1);
  StickCP2.Display.setTextColor(TFT_WHITE, TFT_BLACK);
  StickCP2.Display.drawString("PREV: " + previousStatus, StickCP2.Display.width() / 2, 84, 1);
  StickCP2.Display.drawString(previousExperiment + "  " + previousHash,
                               StickCP2.Display.width() / 2, 101, 1);
  StickCP2.Display.drawString("S: " + (previousOosSharpe.length() ? previousOosSharpe : "--") +
                               "  p: " + (previousPValue.length() ? previousPValue : "--"),
                               StickCP2.Display.width() / 2, 118, 1);
}

void drawLockStatic() {
  title("EXPERIMENT LOCKED", TFT_RED);
  StickCP2.Display.setTextColor(TFT_RED, TFT_BLACK);
  StickCP2.Display.drawString("DO NOT MODIFY", StickCP2.Display.width() / 2, 77, 2);
  StickCP2.Display.setTextSize(1);
  StickCP2.Display.drawString("Hypothesis ✓ Params ✓ Dataset ✓",
                               StickCP2.Display.width() / 2, 103, 1);
  StickCP2.Display.drawString("HASH " + commitHashShort,
                               StickCP2.Display.width() / 2, 120, 1);
}

void drawLockCountdown() {
  const String countdown = formatCountdown(secondsRemaining);
  if (countdown == lastRenderedCountdown) {
    return;
  }

  // Redraw only the timer rectangle during a lock. Repainting the full screen
  // on every 1.5-second poll was the source of visible display flicker.
  StickCP2.Display.fillRect(0, 31, StickCP2.Display.width(), 40, TFT_BLACK);
  StickCP2.Display.setTextDatum(top_center);
  StickCP2.Display.setTextColor(TFT_RED, TFT_BLACK);
  StickCP2.Display.drawString(countdown, StickCP2.Display.width() / 2, 34, 4);
  lastRenderedCountdown = countdown;
}

void drawReveal(bool verified) {
  title(verified ? "VERIFIED" : "LOCK EXPIRED", TFT_GREEN);
  StickCP2.Display.setTextColor(TFT_GREEN, TFT_BLACK);
  StickCP2.Display.drawString(verified ? "COMMIT ✓   RESULT ✓" : "REVEALING...",
                               StickCP2.Display.width() / 2, 38, 2);
  if (verified) {
    StickCP2.Display.drawString("VERIFIED", StickCP2.Display.width() / 2, 63, 2);
  }
  StickCP2.Display.setTextSize(1);
  StickCP2.Display.drawString("OOS Sharpe: " + (oosSharpe.length() ? oosSharpe : "--"),
                               StickCP2.Display.width() / 2, 91, 1);
  StickCP2.Display.drawString("p-value: " + (pValue.length() ? pValue : "--"),
                               StickCP2.Display.width() / 2, 111, 1);
}

void drawReconnecting() {
  title("RECONNECTING", TFT_ORANGE);
  StickCP2.Display.setTextColor(TFT_ORANGE, TFT_BLACK);
  StickCP2.Display.drawString("WiFi/poll unavailable", StickCP2.Display.width() / 2, 54, 2);
  StickCP2.Display.drawString("Retrying backend...", StickCP2.Display.width() / 2, 91, 2);
}

void loadPreviousExperiment() {
  preferences.begin("vault-ui", true);
  previousStatus = preferences.getString("prev_status", "NONE");
  previousExperiment = preferences.getString("prev_experiment", "--");
  previousHash = preferences.getString("prev_hash", "--");
  previousOosSharpe = preferences.getString("prev_sharpe", "");
  previousPValue = preferences.getString("prev_pvalue", "");
  preferences.end();
}

void savePreviousExperiment() {
  preferences.begin("vault-ui", false);
  preferences.putString("prev_status", previousStatus);
  preferences.putString("prev_experiment", previousExperiment);
  preferences.putString("prev_hash", previousHash);
  preferences.putString("prev_sharpe", previousOosSharpe);
  preferences.putString("prev_pvalue", previousPValue);
  preferences.end();
}

void recordVerifiedExperiment() {
  previousStatus = "VERIFIED";
  previousExperiment = experimentLabel();
  previousHash = commitHashShort.length() ? commitHashShort : "--";
  previousOosSharpe = oosSharpe;
  previousPValue = pValue;
  savePreviousExperiment();
}

void render(bool force = false) {
  const bool stateChanged = !screenIsDrawn || lastRenderedState != displayState;
  const bool contentChanged =
      (displayState == DisplayState::LOCKED && lastRenderedHash != commitHashShort) ||
      ((displayState == DisplayState::REVEALING || displayState == DisplayState::VERIFIED) &&
       (lastRenderedOosSharpe != oosSharpe || lastRenderedPValue != pValue)) ||
      (displayState == DisplayState::WAITING &&
       (lastRenderedBackendConnected != backendConnected ||
        lastRenderedPreviousStatus != previousStatus ||
        lastRenderedPreviousExperiment != previousExperiment ||
        lastRenderedPreviousHash != previousHash ||
        lastRenderedPreviousOosSharpe != previousOosSharpe ||
        lastRenderedPreviousPValue != previousPValue));

  if (force || stateChanged || contentChanged) {
    switch (displayState) {
      case DisplayState::WAITING:
        drawWaiting();
        break;
      case DisplayState::COMMITTING:
        drawCommit();
        break;
      case DisplayState::LOCKED:
        drawLockStatic();
        break;
      case DisplayState::REVEALING:
        drawReveal(false);
        break;
      case DisplayState::VERIFIED:
        drawReveal(true);
        break;
      case DisplayState::RECONNECTING:
        drawReconnecting();
        break;
    }
    screenIsDrawn = true;
    lastRenderedState = displayState;
    lastRenderedHash = commitHashShort;
    lastRenderedOosSharpe = oosSharpe;
    lastRenderedPValue = pValue;
    lastRenderedCountdown = "";
    lastRenderedBackendConnected = backendConnected;
    lastRenderedPreviousStatus = previousStatus;
    lastRenderedPreviousExperiment = previousExperiment;
    lastRenderedPreviousHash = previousHash;
    lastRenderedPreviousOosSharpe = previousOosSharpe;
    lastRenderedPreviousPValue = previousPValue;
  }

  if (displayState == DisplayState::LOCKED) {
    drawLockCountdown();
  }
}

bool applyServerPayload(const String& payload) {
  StaticJsonDocument<768> document;
  const DeserializationError error = deserializeJson(document, payload);
  if (error) {
    return false;
  }

  secondsRemaining = document["seconds_remaining"] | 0;
  commitHashShort = String(document["commit_hash_short"] | "");
  oosSharpe = document["oos_sharpe"].isNull()
                  ? ""
                  : String(document["oos_sharpe"].as<float>(), 2);
  pValue = document["p_value"].isNull()
               ? ""
               : String(document["p_value"].as<float>(), 3);

  const char* state = document["state"] | "";
  // This is the entire state machine: map the server's string to a renderer.
  // No transition is calculated from elapsed device time.
  if (strcmp(state, "committing") == 0) {
    displayState = DisplayState::COMMITTING;
    verifiedAcknowledged = false;
  } else if (strcmp(state, "locked") == 0) {
    displayState = DisplayState::LOCKED;
    verifiedAcknowledged = false;
  } else if (strcmp(state, "revealing") == 0) {
    displayState = DisplayState::REVEALING;
    verifiedAcknowledged = false;
  } else if (strcmp(state, "verified") == 0) {
    if (!verifiedAcknowledged) {
      displayState = DisplayState::VERIFIED;
      verifiedAcknowledged = true;
      verifiedAt = millis();
      recordVerifiedExperiment();
    }
  } else {
    return false;
  }

  backendConnected = true;
  return true;
}

bool pollBackend() {
  HTTPClient http;
  if (!http.begin(stateUrl())) {
    return false;
  }

  const int responseCode = http.GET();
  if (responseCode == HTTP_CODE_NOT_FOUND) {
    // A 404 from the state route means the FastAPI backend is reachable but
    // this configured experiment has not been created yet.
    http.end();
    backendConnected = true;
    displayState = DisplayState::WAITING;
    return true;
  }
  const String payload = responseCode == HTTP_CODE_OK ? http.getString() : "";
  http.end();
  return responseCode == HTTP_CODE_OK && applyServerPayload(payload);
}

void beginWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(VAULT_WIFI_SSID, VAULT_WIFI_PASSWORD);
  lastWifiAttemptAt = millis();
}

void resetScreen() {
  // Button B only resets the device's local presentation. It neither clears
  // nor changes the backend experiment, so the next poll safely restores the
  // current server-authoritative state.
  displayState = DisplayState::WAITING;
  commitHashShort = "";
  oosSharpe = "";
  pValue = "";
  secondsRemaining = 0;
  screenIsDrawn = false;
  backendConnected = false;
  render(true);
  lastPollAt = millis() - kPollIntervalMs;  // Force an immediate refresh.
}

}  // namespace

void setup() {
  auto config = M5.config();
  StickCP2.begin(config);
  StickCP2.Display.setRotation(1);
  StickCP2.Display.setTextDatum(top_center);
  loadPreviousExperiment();
  render();
  beginWifi();
}

void loop() {
  StickCP2.update();

  if (StickCP2.BtnB.wasPressed()) {
    resetScreen();
  }

  if (displayState == DisplayState::VERIFIED && verifiedAcknowledged &&
      millis() - verifiedAt >= kVerifiedScreenDurationMs) {
    // Keep the green verification moment visible, then return to the idle
    // screen. The prior result remains persisted and visible there.
    displayState = DisplayState::WAITING;
    render();
  }

  if (WiFi.status() != WL_CONNECTED) {
    // Network loss is visible immediately; a stale LOCK/VERIFIED screen is
    // never retained while the device cannot obtain backend-authoritative data.
    displayState = DisplayState::RECONNECTING;
    render();
    if (millis() - lastWifiAttemptAt >= kWifiRetryIntervalMs) {
      WiFi.disconnect();
      beginWifi();
    }
    delay(25);
    return;
  }

  if (millis() - lastPollAt >= kPollIntervalMs) {
    lastPollAt = millis();
    if (!pollBackend()) {
      displayState = DisplayState::RECONNECTING;
    }
    render();
  }

  delay(25);
}
