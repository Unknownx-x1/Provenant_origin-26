# The Vault hardware track

The Vault is an M5StickC Plus2 display for Provenant's server-authoritative
commit--reveal experiment flow. It only polls and renders the backend state; it
does not calculate whether a lock has expired or permit a reveal.

## IDE setup

1. Install Arduino IDE 2.x and add the M5Stack ESP32 board package through the
   Board Manager.
2. Select **M5StickCPlus2** as the target board and the port assigned to the
   USB-connected device.
3. Install the **M5StickCPlus2** and **ArduinoJson** libraries from Library
   Manager. The sketch also uses the ESP32 core's built-in `WiFi` and
   `HTTPClient` libraries.

## WiFi and backend configuration

Edit [vault_config.h](firmware/vault_device/vault_config.h) before flashing:

- `VAULT_WIFI_SSID` and `VAULT_WIFI_PASSWORD`: the demo WiFi or phone hotspot.
- `VAULT_BACKEND_BASE_URL`: the backend laptop's reachable LAN address, such as
  `http://192.168.1.100:8000`. Do not use `localhost`, which points to the
  device rather than the laptop.
- `VAULT_EXPERIMENT_ID`: the experiment to display, for example `exp-0187`.

Keep real credentials out of version control. Test the device against the
venue WiFi and a phone hotspot before the demo.

## Flashing and operation

1. Open [vault_device.ino](firmware/vault_device/vault_device.ino) in Arduino IDE.
2. Connect the M5StickC Plus2 by USB, select its serial port, then click
   **Upload**.
3. Start the FastAPI backend on the configured laptop interface and create an
   experiment through `POST /vault/commit`.
4. The device polls `GET /vault/state/{experiment_id}` every 1.5 seconds and
   renders `committing`, `locked`, `revealing`, or `verified` exactly as the
   server supplies them.

On startup, and three seconds after a result is verified, the device shows a
**VAULT READY** screen with `WAITING FOR EXPERIMENT`, backend connection status,
and a persisted summary of the previous verified experiment. If WiFi
disconnects or a poll fails, it shows **RECONNECTING** instead of retaining
stale lock or verification information. The backend remains the source of
truth throughout this failure mode.

Press **Button B** to reset the local display and force an immediate backend
poll. This does not reset, reveal, or otherwise change the experiment on the
backend; it is safe to use during an active lock.
