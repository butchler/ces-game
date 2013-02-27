(ns game.util)

(defn log [& stuff]
  (.log js/console (apply pr-str stuff)))

(defn load-entity-resources [entity]
  (let [url (:url (:image entity))
        image (new js/Image)
        loaded (atom false)]
    (when-not (nil? url)
      (set! (.-src image) url)
      (set! (.-onload image) #(reset! loaded true))
      loaded)))

(defn load-resources [entities callback]
  (let [loaded-vars (remove nil? (map load-entity-resources entities))
        interval-id (atom nil)]
    (reset! interval-id
            (.setInterval js/window
                          #(when (every? (comp true? deref) loaded-vars)
                             (.clearInterval @interval-id)
                             (callback))
                          100))))

(defn load-image [url callback]
  (let [image (new js/Image)]
    (set! (.-src image) url)
    (set! (.-onload image) callback)
    image))

(defn load-images [urls callback]
  (let [images (map #(new js/Image) urls)
        all-loaded? (fn []
                      (when (every? #(.-complete %) images)
                        (callback)))]
    (map
      (fn [image url]
        (set! (.-src image) url)
        (set! (.-onload image) all-loaded?))
      images
      urls)))
