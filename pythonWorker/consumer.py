from kafka import KafkaConsumer

# To consume latest messages and auto-commit offsets
consumer = KafkaConsumer('my-topic',
                         bootstrap_servers=['localhost:9092'])

consumer.subscribe(['tweets'])

for message in consumer:
    print message
    print message.value