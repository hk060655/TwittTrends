import time
import boto.sqs
from boto.sqs.message import Message

conn = boto.sqs.connect_to_region("us-east-1", aws_access_key_id='AKIAJ7OSXNTJ2ZYVZ5XQ', aws_secret_access_key='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')

q = conn.get_queue("TwittTrends")


while True:
        for m in q.get_messages(message_attributes=['ID', 'geo']):
                print '%s: %s' % (m, m.get_body())
                print 'geo: %s' % (m.message_attributes["geo"]["string_value"])
                q.delete_message(m)
        time.sleep(1)







