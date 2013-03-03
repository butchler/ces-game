(ns game.simple
  (:require [game.core :as game-loop]
            [game.graphics :as g]))

(defmethod game-loop/draw :simple [game-state]
  (let [{:keys [brush rect]} game-state]
    (g/clear brush)
    (apply g/fill-rect brush "red" rect)))

(defmethod game-loop/update :simple [game-state seconds-elapsed]
  (let [[x y w h] (:rect game-state)
        speed 100 ; in pixels/second
        offset (* speed seconds-elapsed)
        [x y] (map (partial + offset) [x y])
        canvas (:canvas game-state)
        canvas-dimensions [(.-width canvas) (.-height canvas)]
        wrap-position #(if (< %1 %2) %1 (- %2 %1 %3))
        [x y] (map wrap-position [x y] canvas-dimensions [w h])]
    {:rect [x y w h]}))


(defn ^:export start []
  (let [canvas (.getElementById js/document "canvas")
        brush (g/get-brush canvas)
        initial-state {:canvas canvas
                       :brush brush
                       :mode :simple
                       :rect [0 0 100 100]}]
    (set! (.-state js/window) (game-loop/start initial-state))))

