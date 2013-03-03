(ns game.components)

(defn renderable [render-fn]
  {:renderable {:fn render-fn}})

(defn position [x y]
  {:position {:x x, :y y}})

(defn image [url]
  {:image {:url url}})

