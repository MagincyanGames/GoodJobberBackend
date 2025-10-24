import { extend } from "zod/v4-mini";
import Entity from "./Entity";
import { inherits } from "util";
import { InputValidationException, NotFoundException } from "chanfana";

export default abstract class Repository<E extends Entity> {
  private list: E[] = [];

  public GetById(id: number) {
    for (const element of this.list) {
      if (element.id === id) return element;
    }

    throw new NotFoundException();
  }

  public GetByField(field: string, value: any) {
    for (const element of this.list) {
      if (element[field] === value) {
        return element;
      }
    }

    throw new NotFoundException();
  }

  public Add(element: E) {
    if (element.id in this.list.map((e) => e.id)) {
      throw new InputValidationException();
    }

    this.list.push(element);
  }
}
