from kafka import KafkaConsumer
import time
import json

# To consume latest messages and auto-commit offsets
consumer = KafkaConsumer('test',
                         bootstrap_servers=['localhost:9092'])

consumer.subscribe(['tweets'])

while True:
    for message in consumer:
        print message
        print message.value
        parsed = json.loads(message.value)
        print parsed["text"]
    time.sleep(3)
