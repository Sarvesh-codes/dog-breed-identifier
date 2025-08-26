import tensorflow as tf

model = tf.keras.models.load_model("dog_breed_model.h5")
model.export("dog_breed_model")
model.summary()