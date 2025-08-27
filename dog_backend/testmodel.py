import tensorflow as tf

# Load the Keras model (no compilation needed)
model_path = "dog_breed_model.keras"
model = tf.keras.models.load_model(model_path, compile=False)

# 1️⃣ Summary of the model
model.summary()

# 2️⃣ Inspect input and output tensors
print("Inputs:", model.inputs)
print("Outputs:", model.outputs)

# 3️⃣ Inspect each layer's input/output shapes
for i, layer in enumerate(model.layers):
    print(i, layer.name, layer.input.shape, layer.output.shape)
