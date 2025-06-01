---1
ALTER TABLE
ADD COSTRAINT CHECK (
  ABS(EXTRACT(YEAR FROM CURRENT_DATE) - annoN) >= 18 --non sono sicuro che tu possa usare una fuzione dentro ad un check -> forse conviene un trigger
)

---2
ALTER TABLE
ADD COSTRAINT CHECK (
  (EXTRACT(YEAR FROM CURRENT_DATE) - annoN < 35 AND stipendio >= 1500) OR 
  (EXTRACT(YEAR FROM CURRENT_DATE) - annoN >= 35 AND stipendio >= 2000  ) 
  --si puo fare piu corta ma adesso non ho voglia di pensarla
)
---3

CREATE FUNCTION progett()
RETURNS TRIGGER
AS $$
BEGIN

  IF (NEW.supervisor is NOT NULL) THEN
    IF (SELECT stipendio FROM impiegati WHERE CF = NEW.supervisor ) <= NEW.stipendio THEN
      RAISE EXCEPTION 'sus';
      END IF
  END IF

  IF (SELECT max(stipendio) FROM impiegati WHERE supervisor = NEW.CF ) > NEW.stipendio THEN
      RAISE EXCEPTION 'sus';
  END IF
  RETURN NEW;
END
$$


CREATE TRIGGER 
AFTER INSER OR UPDATE ON Impiegati
FOR EACH ROW EXECUTE progetti()

--- 4
--sis suppone che vengano inseriti i progetti e le persone che ci lavorano in un unica transazione, il trigger controllera alla fine prima di effettuare effettivamente la scrittura sul disco ma al commit della transazione
CREATE FUNCTION progett()
RETURNS TRIGGER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM progetti p
             INNER JOIN LavoraSu ON numerop = p.numeroP AND CFImp = NEW.direttore
             WHERE numDip = NEW.numDIP ) THEN
             RAISE EXCEPTION 'sis';
  ENDIF

  IF EXISTS (SELECT 1 from Dipartimenti where direttore = new.direttore AND numdip <> new.numDip) THEN
    raise EXCEPTION
  ENDIF
  return new;

END
$$


CREATE costraint TRIGGER 
AFTER INSERT OR UPDATE ON Dipartimenti
DEFERRED INITIALLY DEFERRED
FOR EACH ROW EXECUTE progetti()


CREATE FUNCTION progett()
RETURNS TRIGGER
AS $$
BEGIN
-- NON POSSO CANCELLARE o aggiornare il direttore altrimenti esplode il db, devo prima cambiarlo e poi posso cancellarlo
  IF EXISTS(SELECT 1 FROM Progetti p
            INNER JOIN Dipartimenti d on numdip = p.numdip
            WHERE d.direttore = OLD.CFimp AND p.numeroP = OLD.numeroP) THEN
            raise exception '';
  END IF
  
  IF TG_OP = 'UPDATE' THEN
    return NEW;
  END IF
  return OLD;

END
$$

CREATE costraint TRIGGER 
AFTER DELETE OR UPDATE ON LavoraSu
FOR EACH ROW EXECUTE progetti()
--si suppone che un progetto non possa cambiare dipartimento

---5
CREATE FUNCTION progett()
RETURNS TRIGGER
AS $$
BEGIN

  IF (SELECT SUM(ore) from LavoraSu
      WHERE numeroP = NEW.numeroP) * 50 > (SELECT budget from Progetti where numeroP=New.numeroP) THEN
      RAISE EXCEPTION '';
  END IF

  return NEW;

END
$$
CREATE costraint TRIGGER 
AFTER INSERT OR UPDATE ON LavoraSu
FOR EACH ROW EXECUTE progetti()