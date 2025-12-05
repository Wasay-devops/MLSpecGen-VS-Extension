import tensorflow as tf
import numpy as np

# Example Keras code with contract violation
# VIOLATION: Wrong data type - model expects float32 but receives string data

# Create a simple model
model = tf.keras.Sequential([
    tf.keras.layers.Dense(32, activation='relu', input_shape=(10,)),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Create training data with correct type
X_train = np.random.random((100, 10)).astype(np.float32)
y_train = np.random.randint(0, 2, (100,)).astype(np.float32)

# Train the model
model.fit(X_train, y_train, epochs=1, verbose=0)

# CONTRACT VIOLATION: Wrong data type
# Model expects numeric float32 array but receives string data
# This violates the data type contract
X_test_string = np.array([['1.0', '2.0', '3.0', '4.0', '5.0', '6.0', '7.0', '8.0', '9.0', '10.0']] * 10)
predictions = model.predict(X_test_string)

print("Predictions:", predictions)

