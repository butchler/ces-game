(ns game
  (:require [game.levels :as levels]
            [game.graphics :as g]
            [clojure.browser.repl :as repl]))

(defn ^:export run [game-state]
  (let [brush (:brush @game-state)]

    (g/fill brush "black")

    (let [frame-id (g/request-frame #(run game-state))]
      (swap! game-state assoc :frame-id frame-id))))

(defn ^:export start [canvas-id]
  (let [canvas (.getElementById js/document canvas-id)
        brush (g/get-brush canvas)
        game-state (atom {:canvas canvas, :brush brush})]
    (run game-state)
    game-state))

(defn ^:export stop [game-state]
  (g/cancel-frame (:frame-id @game-state)))
