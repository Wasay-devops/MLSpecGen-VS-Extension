import tensorflow as tf
import numpy as np

# Sample ML code with potential contract violations
def create_model():
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(64, activation='relu', input_shape=(10,)),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    return model

def train_model():
    # Create model
    model = create_model()
    
    # Compile model
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    
    # Generate sample data
    X_train = np.random.random((1000, 10))
    y_train = np.random.randint(0, 2, (1000, 1))
    
    # Train model
    model.fit(X_train, y_train, epochs=10, batch_size=32)
    
    # Potential violation: predict without proper input validation
    X_test = np.random.random((100, 10))
    predictions = model.predict(X_test)
    
    return predictions

# Another potential violation: using model before training
def bad_example():
    model = create_model()
    # This will fail - model not compiled or trained
    predictions = model.predict(np.random.random((10, 10)))
    return predictions

if __name__ == "__main__":
    # Good example
    print("Training model...")
    predictions = train_model()
    print(f"Predictions shape: {predictions.shape}")
    
    # Bad example (commented out to avoid crash)
    # print("Bad example...")
    # bad_predictions = bad_example()

