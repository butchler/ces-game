(ns game.util)

(defn log [& stuff]
  (.log js/console (apply pr-str stuff)))

