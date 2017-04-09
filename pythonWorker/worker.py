import time
import boto.sqs as sqs, boto.sns as sns
from boto.sqs.message import Message
import config as key
import json
from watson_developer_cloud import NaturalLanguageUnderstandingV1
import watson_developer_cloud.natural_language_understanding.features.v1 as \
    features
from multiprocessing import Pool
from kafka import KafkaConsumer



# conn = sqs.connect_to_region("us-east-1", aws_access_key_id='AKIAJ7OSXNTJ2ZYVZ5XQ',
#                                   aws_secret_access_key='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')
# q = conn.get_queue("TwittTrends")

"""sqs connection"""
sqs_conn = sqs.connect_to_region("us-east-1", aws_access_key_id=key.aws['accessKeyId'],
                                  aws_secret_access_key=key.aws['secretAccessKey'])
q = sqs_conn.get_queue("twit_trend")

"""sns connection"""
sns_conn = sns.connect_to_region("us-east-1", aws_access_key_id=key.aws['accessKeyId'],
                                   aws_secret_access_key=key.aws['secretAccessKey'])



"""nlu connection"""
nlu = NaturalLanguageUnderstandingV1(version='2017-02-27',
                                     username=key.ibm["username"],
                                     password=key.ibm["password"])

sns_conn.create_topic('twit')
topics = sns_conn.get_all_topics()["ListTopicsResponse"]["ListTopicsResult"]["Topics"]
topic = topics[0]["TopicArn"]
sns_conn.subscribe(topic=topic,protocol="http",endpoint=key.endpoint)

# res = sns_conn.publish(topic=topic,message="test mesg",subject="test")
# print res

# To consume latest messages and auto-commit offsets
consumer = KafkaConsumer('test',
                         bootstrap_servers=['localhost:9092'])

consumer.subscribe(['tweets'])


# SQS
# def processMsg(msg):
#     for m in msg:
#         try:
#             text = m.get_body()
#             geo = m.message_attributes["geo"]["string_value"]
#             print '%s: %s' % (m, text)
#             print 'geo: %s' % (geo)
#             res = nlu.analyze([features.Sentiment()], text=text)
#             print json.dumps(res, indent=2)
#             # {u'language': u'en',
#             #  u'sentiment': {u'document': {u'score': -0.546603, u'label': u'negative'}}}
#
#             senti = res
#             print senti
#             label = senti['sentiment']['document']['label']
#             print label
#
#             msg = json.dumps({'text':text,'geo':geo,'senti':label})
#             res = sns_conn.publish(topic=topic, message=msg, subject="twit_senti")
#
#         except Exception as e:
#             print e
#             print("Error detected, continuing...")
#             continue
#         else:
#             q.delete_message(m)
#
#     time.sleep(5)

# Kafka
def processMsg(parsed):
    try:
        text = parsed['text']
        geo = parsed['geo']
        print 'text: %s' % (text)
        print 'geo: %s' % (geo)
        res = nlu.analyze([features.Sentiment()], text=text)
        print json.dumps(res, indent=2)
        # {u'language': u'en',
        #  u'sentiment': {u'document': {u'score': -0.546603, u'label': u'negative'}}}

        senti = res
        print senti
        label = senti['sentiment']['document']['label']
        print label

        msg = json.dumps({'text':text,'geo':geo,'senti':label})
        res = sns_conn.publish(topic=topic, message=msg, subject="twit_senti")

    except Exception as e:
        print e
        print("Error detected, continuing...")


if __name__ == '__main__':

    pool = Pool(processes=5)

    i = 0

    # SQS
    # while True:
    #     pool.apply(processMsg, (q.get_messages(message_attributes=['ID', 'geo']), ))
    #     print "process once"

    # Kafka
    while True:
        for message in consumer:
            pool.apply(processMsg, (json.loads(message.value),))
            print "process once"
        time.sleep(5)