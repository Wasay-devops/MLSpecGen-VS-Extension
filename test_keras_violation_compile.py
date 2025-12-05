import tensorflow as tf
import numpy as np

# Example Keras code with contract violation
# VIOLATION: Calling fit() without compile() - model must be compiled first

# Create a model
model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dense(10, activation='softmax')
])

# CONTRACT VIOLATION: Trying to fit without compiling
# The model.compile() call is missing, which violates the API contract
# Keras requires compile() before fit()

# Create training data
X_train = np.random.random((1000, 784))
y_train = np.random.randint(0, 10, (1000,))
y_train_onehot = tf.keras.utils.to_categorical(y_train, 10)

# This will fail because model is not compiled
model.fit(X_train, y_train_onehot, epochs=1, verbose=1)

print("Model trained successfully")

