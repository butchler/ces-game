(ns game.core
  (:require [game.graphics :as g]))

(defmulti draw :mode)
(defmulti update :mode)

(defn get-current-time
  "Returns the Unix epoch time (time since January 1, 1970) in seconds."
  []
  (/ (new js/Date) 1000))

(defn run [game-state]
  (let [current-game-state @game-state]

    (draw current-game-state)

    (let [current-time (get-current-time)
          previous-time @(:previous-frame current-game-state)
          seconds-elapsed (- current-time previous-time)
          next-game-state (update current-game-state seconds-elapsed)
          next-frame-id (g/request-frame #(run game-state))]

      (reset! (:frame-id @game-state) next-frame-id)
      (reset! (:previous-frame @game-state) current-time)
      (swap! game-state merge next-game-state))))

(defn resume [game-state]
  (when (nil? @(:frame-id @game-state))
    (reset! (:previous-frame @game-state) (get-current-time))
    (run game-state)))

(defn pause [game-state]
  (swap! (:frame-id @game-state) (fn [frame-id]
                                   (when-not (nil? frame-id)
                                     (g/cancel-frame frame-id)
                                     nil))))

(defn start [initial-state]
  (let [game-state (atom (merge initial-state
                                {:frame-id (atom nil)
                                 :previous-frame (atom nil)}))]
    (resume game-state)
    game-state))

