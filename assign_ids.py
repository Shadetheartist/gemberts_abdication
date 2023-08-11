import json
import os
import subprocess


# Load the JSON data
with open("card_data.json", "r") as json_file:
    cards = json.load(json_file)

counter = 1
# For each card in the JSON array
for card in cards:
    card['id'] = counter
    counter += 1

with open("card_data.json", "w") as json_file:
    json_str = json.dumps(cards)
    json_file.write(json_str)



print("Done!")