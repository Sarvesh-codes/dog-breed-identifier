import tensorflow as tf

#model = tf.keras.models.load_model("dog_breed_model.h5")
model=tf.keras.models.load_model("dog_breed_model.h5")
model.save("dog_breed_model.keras")