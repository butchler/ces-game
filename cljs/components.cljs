(ns game.components)

(def *image-path* "./images")

(defn image [file]
  {:image (apply str *image-path* "/" file)})

(defn position [x y]
  {:position {:x x, :y y}})
