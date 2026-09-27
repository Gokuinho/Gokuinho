; ============================================================================
;  Raccourcis clavier pour piloter l'overlay SANS quitter GTA / FiveM
;  Nécessite AutoHotkey v2 (gratuit) : https://www.autohotkey.com/
;  Double-clique sur ce fichier une fois le kit lancé (Lancer-Live.bat).
;
;  Ctrl+Alt+1  écran « Le live commence »
;  Ctrl+Alt+2  présentation du personnage
;  Ctrl+Alt+3  en jeu (HUD)
;  Ctrl+Alt+4  PAUSE : cache le jeu (scène privée, mot de passe, menu…)
;  Ctrl+Alt+5  écran de fin
;  Ctrl+Alt+0  retirer la question épinglée
; ============================================================================
#Requires AutoHotkey v2.0
#SingleInstance Force

BASE := "http://localhost:7777"
PIN  := ""   ; mets ici ton LIVE_PIN si tu en as défini un

LivePost(path, body := "") {
    try {
        req := ComObject("WinHttp.WinHttpRequest.5.1")
        req.Open("POST", BASE . path, false)
        req.SetRequestHeader("Content-Type", "application/json")
        req.SetRequestHeader("x-live-pin", PIN)
        req.Send(body)
        if (req.Status != 200)
            TrayTip("Live RP", "Erreur " req.Status " : " req.ResponseText)
    } catch as e {
        TrayTip("Live RP", "Kit injoignable : lance Lancer-Live.bat")
    }
}

^!1::LivePost("/api/mode/starting")
^!2::LivePost("/api/mode/intro")
^!3::LivePost("/api/mode/live")
^!4::LivePost("/api/mode/pause")
^!5::LivePost("/api/mode/ending")
^!0::LivePost("/api/pin", "{}")
