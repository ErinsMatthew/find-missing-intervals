import config from 'config';
import moment from 'moment';
import sqlite3 from 'sqlite3';


const NOT_FOUND = -1;


main();


async function main() {
    const loadedPeriods = await getLoadedPeriods();

    console.log( JSON.stringify( findAllPeriods().filter( period => {
        return loadedPeriods.indexOf( period ) == NOT_FOUND;
    } ).map( period => {
        return {
            "timestamp": period
        };
    } ) ) );
}


function findPeriodForTime( time ) {
    time.minutes( getPeriodMinutes( time, config.get( 'increment.minutes' ) ) ); 
    time.seconds( 0 );
    time.milliseconds( 0 );

    return time.toISOString();
}

function findAllPeriods() {
    let startTime = moment( findPeriodForTime( moment( config.get( 'minTimestamp' ) ) ) );
    let endTime = moment.now();

    let periods = []; 
    
    for ( let time = startTime; time.isSameOrBefore( endTime ); time.add( config.get( 'increment' ) ) ) {
        periods.push( time.toISOString() );
    }
    
    return periods;
}

async function getLoadedPeriods() {
    return new Promise( ( resolve, reject ) => {
        let columnName = config.get( 'database.column' );

        let periods = [];

        let db;

        try {
            db = new sqlite3.Database( config.get( 'database.file' ), sqlite3.OPEN_READONLY );
        
            db.each( config.get( 'database.query' ), ( err, row ) => {
                if ( err ) {
                    reject( err );
                }

                periods.push( findPeriodForTime( moment( row[ columnName ] ) ) );
            }, () => {
                resolve( periods );
            } );
        } catch ( error ) {
            reject( error );
        } finally {
            db.close();
        }
    } );
}

function getPeriodMinutes( time, value ) {
    return value * Math.floor( time.minute() / value );
}
