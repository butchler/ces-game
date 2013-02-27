(ns game.graphics)

(def request-frame
  (or (.-requestAnimationFrame js/window)
      (.-webkitRequestAnimationFrame js/window)
      (.-mozRequestAnimationFrame js/window)
      (.-oRequestAnimationFrame js/window)
      (.-msRequestAnimationFrame js/window)
      (fn [callback] (js/setTimeout callback (/ 1000 60)))))

(def cancel-frame
  (or (.-cancelAnimationFrame js/window)
      (.-webkitCancelAnimationFrame js/window)
      (.-mozCancelAnimationFrame js/window)
      (.-oCancelAnimationFrame js/window)
      (.-msCancelAnimationFrame js/window)
      (fn [frame-id] (js/clearTimeout frame-id))))

(defn get-brush [canvas]
  (.getContext canvas "2d"))

(defn clear [brush]
  (let [width (.-width (.-canvas brush))
        height (.-height (.-canvas brush))]
    (.clearRect brush 0 0 width height)))

(defn fill-rect [brush x y width height color]
  (.save brush)

  (set! (.-fillStyle brush) color)
  (.fillRect brush x y width height)

  (.restore brush))

(defn fill [brush color]
  (let [width (.-width (.-canvas brush))
        height (.-height (.-canvas brush))]
    (fill-rect brush 0 0 width height color)))

(defn draw-image [brush image x y]
  (.drawImage brush image x y))
