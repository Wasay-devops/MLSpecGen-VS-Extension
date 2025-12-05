import tensorflow as tf
import numpy as np

# Example Keras code with contract violation
# VIOLATION: Wrong input shape - model expects (784,) but receives (100, 28, 28)

# Create a model expecting flattened input
model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Create dummy training data
X_train = np.random.random((1000, 784))
y_train = np.random.randint(0, 10, (1000,))
y_train_onehot = tf.keras.utils.to_categorical(y_train, 10)

# Train the model
model.fit(X_train, y_train_onehot, epochs=1, verbose=0)

# CONTRACT VIOLATION: Wrong input shape
# Model expects (batch, 784) but receives (batch, 28, 28)
# This will cause a shape mismatch error
X_test_wrong_shape = np.random.random((10, 28, 28))  # Wrong shape!
predictions = model.predict(X_test_wrong_shape)

print("Predictions:", predictions)

