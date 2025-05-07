import sys
import os
import logging
import json
import requests
from bs4 import BeautifulSoup
import re
import pandas as pd
import numpy as np
import sqlite3
import datetime
import random
import time
import whr


MATCHES_PER_PAGE = 1000
MIN_DATE = "1988-10-01"
MEN_W2 = 17.4
WOMEN_W2 = 14.4

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(
    filename="scheduler.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def init_session():

    with open("LAST_INFO.JSON", "r") as file:
        last_info = json.load(file)
    last_info

    # initiate session

    url = "https://results.ittf.link/index.php"
    username = "scraper"
    password = "Scraper@2025"

    session = requests.Session()
    response = session.get(url)

    soup = BeautifulSoup(response.text, "html.parser")
    token_input = soup.find(
        "input", {"type": "hidden", "name": re.compile("[a-f0-9]{32}")}
    )

    token_name = token_input.get("name")
    token_value = token_input.get("value")

    login_data = {
        "username": username,
        "password": password,
        "option": "com_users",
        "task": "user.login",
        token_name: token_value,
    }

    session.post(url, data=login_data)
    return session, last_info


def get_new_events(session, last_info):

    # get new events

    response = session.get(
        "https://results.ittf.link/index.php/events/list/27?resetfilters=0&clearordering=0&clearfilters=0&limit27=200&format=json"
    )
    data = response.json()[0]
    new_events = pd.DataFrame(data)
    new_events = new_events[
        [
            "vw_tournaments___tournament_id_raw",
            "vw_tournaments___tour_end_raw",
            "vw_tournaments___matches",
        ]
    ]
    new_events.columns = ["tournament", "end_date", "matches"]
    new_events["matches"] = new_events["matches"].apply(
        lambda x: int(x.split(">")[1].split("<")[0])
    )
    new_events = new_events.set_index("tournament")

    last_event = last_info["event"]
    new_events = new_events.loc[:last_event].iloc[:-1].reset_index()

    if not new_events.empty:
        last_event = new_events.iloc[0, 0]
        last_info["event"] = int(last_event)
        last_info["data_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open("LAST_INFO.JSON", "w") as file:
            json.dump(last_info, file)
        conn = sqlite3.connect("DATA.DB")
        new_events[["tournament", "end_date"]].to_sql(
            "events", conn, if_exists="append", index=False
        )
        conn.close()

    return new_events


def get_new_matches_raw(session, last_info, new_events):

    df_list = []
    for _, row in new_events.iterrows():
        event = row["tournament"]
        matches = row["matches"]

        pages = (matches - 1) // MATCHES_PER_PAGE + 1
        for page in range(pages):
            url = f"https://results.ittf.link/index.php?listid=68&Itemid=441&resetfilters=1&abc={event}&limit68={MATCHES_PER_PAGE}&limitstart68={page * MATCHES_PER_PAGE}&vw_matches___tournament_id_raw[value][]={event}&format=json"
            response = session.get(url)
            data = response.json()
            sleep_time = random.uniform(0, 1)
            time.sleep(sleep_time)
            df = pd.DataFrame(data[0])
            df = df[
                [
                    "vw_matches___id_raw",
                    "vw_matches___tournament_id_raw",
                    "vw_matches___player_a_id_raw",
                    "vw_matches___player_b_id_raw",
                    "vw_matches___player_x_id_raw",
                    "vw_matches___player_y_id_raw",
                    "vw_matches___res_raw",
                ]
            ]
            df.columns = [
                "match",
                "tournament",
                "player_a",
                "player_b",
                "player_x",
                "player_y",
                "result",
            ]
            df["score_a"] = df["result"].apply(lambda x: int(x.split("-")[0].strip()))
            df["score_x"] = df["result"].apply(lambda x: int(x.split("-")[1].strip()))
            df["res"] = "L"
            df.iloc[df["score_a"] > df["score_x"], -1] = "W"
            df.iloc[df["score_a"] == df["score_x"], -1] = "D"
            df_list.append(df)

    new_matches_raw = pd.concat(df_list).reset_index(drop=True)

    if not new_matches_raw.empty:
        last_info["data_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open("LAST_INFO.JSON", "w") as file:
            json.dump(last_info, file)

    return new_matches_raw


def get_new_players(session, last_info, new_matches_raw):
    new_players = set(
        int(x)
        for x in new_matches_raw[
            ["player_a", "player_b", "player_x", "player_y"]
        ].values.flatten()
        if ~np.isnan(x)
    )
    conn = sqlite3.connect("DATA.DB")
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT id FROM players")
    old_players = [row[0] for row in cursor.fetchall()]
    conn.close()
    new_players_list = list(new_players - set(old_players))

    df_list = []
    for player in new_players_list:
        url = f"https://results.ittf.link/index.php?option=com_fabrik&view=list&listid=60&Itemid=391&resetfilters=1&vw_profiles___player_id_raw[value][]={player}&format=json"
        response = session.get(url)
        data = response.json()
        df_list += data[0]
    new_players = pd.DataFrame(df_list)

    if not new_players.empty:
        new_players = new_players[
            [
                "vw_profiles___player_id_raw",
                "vw_profiles___player_id",
                "vw_profiles___gender_raw",
                "vw_profiles___profile",
            ]
        ]
        new_players.columns = ["id", "name", "gender", "profile"]
        new_players["yob"] = new_players["profile"].apply(
            lambda x: x.split("<br/>")[3].split(": ")[1]
        )
        new_players["assoc"] = new_players["profile"].apply(
            lambda x: x.split("<br/>")[1].split(": ")[1]
        )
        new_players["ma"] = new_players["name"].apply(
            lambda x: x.split("(")[1].rstrip(")")
        )
        new_players["name"] = new_players["name"].apply(
            lambda x: x.split("(")[0].strip(" ")
        )
        new_players = new_players.drop(columns="profile")

        last_info["data_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open("LAST_INFO.JSON", "w") as file:
            json.dump(last_info, file)
        conn = sqlite3.connect("DATA.DB")
        new_players.to_sql("players", conn, if_exists="append", index=False)
        conn.close()

    return None


def process_new_matches(last_info, all_players, new_matches_raw, new_events):

    new_matches = new_matches_raw.merge(
        new_events[["tournament", "end_date"]], on="tournament", how="left"
    )
    for suffix in ["_a", "_b", "_x", "_y"]:
        new_matches = (
            new_matches.merge(
                all_players[["id", "gender"]],
                left_on="player" + suffix,
                right_on="id",
                how="left",
            )
            .rename(columns={"gender": "gender" + suffix})
            .drop(columns=["id"])
        )

    if not new_matches.empty:
        last_info["data_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open("LAST_INFO.JSON", "w") as file:
            json.dump(last_info, file)
        conn = sqlite3.connect("DATA.DB")
        new_matches.to_sql("matches", conn, if_exists="append", index=False)
        conn.close()

    return None


def whr_calc(matches, w2):
    matches["res_whr"] = matches["res"].apply(
        lambda x: "B" if x == "W" else "W" if x == "L" else x
    )
    matches["days"] = (
        pd.to_datetime(matches["end_date"]) - pd.to_datetime(MIN_DATE)
    ).apply(lambda x: x.days)
    matches["player_a"] = matches["player_a"].astype(int)
    matches["player_x"] = matches["player_x"].astype(int)
    games = []
    for _, row in matches.iterrows():
        games.append(
            [
                str(row["player_a"]),
                str(row["player_x"]),
                row["res_whr"],
                int(row["days"]),
            ]
        )
    base = whr.Base(config={"w2": w2})
    base.create_games(games)
    base.iterate_until_converge(verbose=False)
    ordered_ratings = base.get_ordered_ratings()
    data = []
    for name, ratings in ordered_ratings:
        for date, rating, error in ratings:
            data.append({"name": name, "date": date, "rating": rating, "error": error})
    ratings = pd.DataFrame(data)
    return ratings


def rankings(ratings, all_players, w2, today):
    one_year = today - 365

    recent = ratings[ratings["date"] > one_year]
    latest = recent.sort_values("date").groupby("name").last().reset_index()
    latest["days_since"] = today - latest["date"]
    latest["new_error"] = (latest["error"] ** 2 + w2 * latest["days_since"]) ** 0.5
    latest["adjusted_rating"] = latest["rating"] - latest["new_error"]
    latest["name"] = latest["name"].astype(int)
    latest = latest.rename(columns={"name": "id"})
    latest = latest.merge(all_players, on="id", how="left")
    latest = latest.sort_values("rating", ascending=False).reset_index(drop=True)
    latest["name_zh"] = latest["name_zh"].fillna(latest["name"])
    latest["assoc_zh"] = latest["assoc_zh"].fillna("")
    result = []
    for idx, row in latest.iterrows():
        data = {
            "rank": idx + 1,
            "id": row["id"],
            "name": row["name"],
            "name_zh": row["name_zh"],
            "yob": row["yob"],
            "association": row["ma"],
            "association_zh": row["assoc_zh"],
            "rating": np.round(float(row["rating"]), 2),
            "error": float(row["new_error"]),
            "adjusted_rating": np.round(float(row["adjusted_rating"]), 2),
        }
        result.append(data)
    return result


def men_single_rating(last_info):

    conn = sqlite3.connect("DATA.DB")
    query = """
    SELECT * FROM matches 
    WHERE gender_a = 'M' AND gender_x = 'M' 
    AND player_b IS NULL AND player_y IS NULL
    AND player_a != player_x
    """
    men_matches = pd.read_sql_query(query, conn)
    conn.close()

    men_ratings = whr_calc(men_matches, MEN_W2)

    last_info["rating_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("LAST_INFO.JSON", "w") as file:
        json.dump(last_info, file)

    conn = sqlite3.connect("DATA.DB")
    men_ratings.to_sql("men_ratings", conn, if_exists="replace", index=False)
    conn.close()

    return None


def men_single_ranking(last_info, all_players):

    conn = sqlite3.connect("DATA.DB")
    men_ratings = pd.read_sql_query("SELECT * FROM men_ratings", conn)
    conn.close()

    TODAY = datetime.datetime.now()
    today = (TODAY - pd.to_datetime(MIN_DATE)).days

    men_ranking = rankings(men_ratings, all_players, MEN_W2, today)

    last_info["ranking_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("LAST_INFO.JSON", "w") as file:
        json.dump(last_info, file)

    with open("men_ranking.json", "w") as file:
        json.dump(men_ranking, file)

    return None


def women_single_rating(last_info):

    conn = sqlite3.connect("DATA.DB")
    query = """
    SELECT * FROM matches 
    WHERE gender_a = 'W' AND gender_x = 'W' 
    AND player_b IS NULL AND player_y IS NULL
    AND player_a != player_x
    """
    women_matches = pd.read_sql_query(query, conn)
    conn.close()

    women_ratings = whr_calc(women_matches, WOMEN_W2)

    last_info["rating_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("LAST_INFO.JSON", "w") as file:
        json.dump(last_info, file)

    conn = sqlite3.connect("DATA.DB")
    women_ratings.to_sql("women_ratings", conn, if_exists="replace", index=False)
    conn.close()

    return None


def women_single_ranking(last_info, all_players):

    conn = sqlite3.connect("DATA.DB")
    women_ratings = pd.read_sql_query("SELECT * FROM women_ratings", conn)
    conn.close()

    TODAY = datetime.datetime.now()
    today = (TODAY - pd.to_datetime(MIN_DATE)).days

    women_ranking = rankings(women_ratings, all_players, WOMEN_W2, today)

    last_info["ranking_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("LAST_INFO.JSON", "w") as file:
        json.dump(last_info, file)

    with open("women_ranking.json", "w") as file:
        json.dump(women_ranking, file)

    return None


def hist_rankings(ratings, eval_date, w2):
    date_str = eval_date.strftime("%Y-%m-%d")
    today = (eval_date - pd.to_datetime(MIN_DATE)).days
    one_year = today - 365

    latest = ratings[ratings["date"] > one_year]
    latest = latest.sort_values("date").groupby("name").last().reset_index()
    latest["name"] = latest["name"].astype(int)
    latest = latest.rename(columns={"name": "id"})
    latest = (
        latest.sort_values("rating", ascending=False).reset_index(drop=True).iloc[:100]
    )
    rank = latest
    rank["rank"] = rank.index + 1
    rank["eval_date"] = date_str
    rank["days_since"] = today - rank["date"]
    rank["new_error"] = (rank["error"] ** 2 + w2 * rank["days_since"]) ** 0.5
    rank = rank[["eval_date", "rank", "id", "rating", "new_error"]]
    rank.columns = ["eval_date", "rank", "id", "rating", "error"]
    return rank


def daily_update():

    try:
        session, last_info = init_session()
        new_events = get_new_events(session, last_info)

        if not new_events.empty:
            new_matches_raw = get_new_matches_raw(session, last_info, new_events)
            get_new_players(session, last_info, new_matches_raw)

            conn = sqlite3.connect("DATA.DB")
            all_players = pd.read_sql_query("SELECT * FROM players", conn)
            conn.close()

            process_new_matches(last_info, all_players, new_matches_raw, new_events)
            men_single_rating(last_info)
            women_single_rating(last_info)

        conn = sqlite3.connect("DATA.DB")
        all_players = pd.read_sql_query("SELECT * FROM players", conn)
        pc = pd.read_sql_query("SELECT * FROM players_chinese", conn)
        ac = pd.read_sql_query("SELECT * FROM associations_chinese", conn)
        conn.close()

        all_players = all_players.merge(
            pc[["id", "name_zh"]], on="id", how="left"
        ).merge(ac, on="assoc", how="left")

        men_single_ranking(last_info, all_players)
        women_single_ranking(last_info, all_players)

        conn = sqlite3.connect("DATA.DB")
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(eval_date) FROM men_hist_rank")
        LAST_EVAL = pd.to_datetime(cursor.fetchone()[0])
        conn.close()

        TODAY = datetime.datetime.now()
        LAST_SUN = TODAY - datetime.timedelta(days=TODAY.weekday() + 1)
        if TODAY.weekday() >= 2 and LAST_EVAL < LAST_SUN:
            eval_dates = pd.date_range(
                LAST_EVAL + datetime.timedelta(days=1), LAST_SUN, freq="W-SUN"
            )

            for eval_date in eval_dates:
                date_str = eval_date.strftime("%Y-%m-%d")

                conn = sqlite3.connect("DATA.DB")
                query = f"""
                SELECT * FROM matches 
                WHERE gender_a = 'M' AND gender_x = 'M' 
                AND player_b IS NULL AND player_y IS NULL
                AND player_a != player_x AND end_date <= '{date_str}'
                """
                men_matches = pd.read_sql_query(query, conn)
                conn.close()

                men_ratings = whr_calc(men_matches, MEN_W2)
                men_rankings = hist_rankings(men_ratings, eval_date, MEN_W2)

                conn = sqlite3.connect("DATA.DB")
                men_rankings.to_sql(
                    "men_hist_rank", conn, if_exists="append", index=False
                )
                conn.close()

                conn = sqlite3.connect("DATA.DB")
                query = f"""
                SELECT * FROM matches 
                WHERE gender_a = 'W' AND gender_x = 'W' 
                AND player_b IS NULL AND player_y IS NULL
                AND player_a != player_x AND end_date <= '{date_str}'
                """
                women_matches = pd.read_sql_query(query, conn)
                conn.close()

                women_ratings = whr_calc(women_matches, WOMEN_W2)
                women_rankings = hist_rankings(women_ratings, eval_date, WOMEN_W2)

                conn = sqlite3.connect("DATA.DB")
                women_rankings.to_sql(
                    "women_hist_rank", conn, if_exists="append", index=False
                )
                conn.close()

        return True
    except Exception as e:
        logging.error(f"Error in daily update process: {str(e)}")
        return False


if __name__ == "__main__":
    daily_update()
