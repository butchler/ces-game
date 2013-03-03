(ns game.util)

(defn log [& stuff]
  (.log js/console (apply pr-str stuff)))

(defn get-current-time
  "Returns the Unix epoch time (time since January 1, 1970) in seconds."
  []
  (/ (new js/Date) 1000))

