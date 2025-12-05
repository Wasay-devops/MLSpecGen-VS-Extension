import tensorflow as tf
import numpy as np

# Example Keras code with contract violation
# VIOLATION: Calling predict() before fit() - model is not trained

# Create a simple model
model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dense(10, activation='softmax')
])

# Compile the model
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Create dummy test data
X_test = np.random.random((100, 784))
y_test = np.random.randint(0, 10, (100,))

# CONTRACT VIOLATION: Trying to predict without training the model first
# The model weights are randomly initialized and haven't been trained
# This violates the API contract that requires fit() before predict()
predictions = model.predict(X_test)

print("Predictions shape:", predictions.shape)
print("First prediction:", predictions[0])

